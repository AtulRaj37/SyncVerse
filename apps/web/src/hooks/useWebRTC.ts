"use client";

import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useUserStore } from '../store/useUserStore';

export const useWebRTC = () => {
    const { socket, roomState } = useSocketStore();
    const { id: currentUserId } = useUserStore();

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 60 } // Request smooth framerate but don't force downscaling
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
                systemAudio: "include", // explicitly surface the Share Audio OS prompt
                surfaceSwitching: "include" 
            } as any);
            
            // Tell the browser WebRTC encoder that this stream contains continuous motion (video)
            // otherwise Chrome automatically throttles screen shares to ~5 FPS to save bandwidth.
            const videoTrack = stream.getVideoTracks()[0];
            if ('contentHint' in videoTrack) {
                (videoTrack as any).contentHint = 'motion';
            }

            setLocalStream(stream);

            videoTrack.onended = () => {
                stopScreenShare();
            };

            if (roomState && socket) {
                Object.values(roomState.users).forEach((user) => {
                    if (user.userId !== currentUserId) {
                        createPeerConnection(user.userId, stream);
                    }
                });
            }
        } catch (error) {
            console.error("Error accessing display media", error);
        }
    };

    const stopScreenShare = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        pendingCandidates.current.clear();
        setRemoteStream(null);
    };

    const createPeerConnection = async (targetUserId: string, stream?: MediaStream) => {
        const pc = new RTCPeerConnection(rtcConfig);
        peersRef.current.set(targetUserId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('C2S_WEBRTC_ICE', { targetUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        if (stream) {
            stream.getTracks().forEach(track => {
                const sender = pc.addTrack(track, stream);
                // Attempt to cap bitrate to prevent black screen network drops on high motion (movies/youtube)
                if (track.kind === 'video') {
                    try {
                        const params = sender.getParameters();
                        if (!params.encodings) {
                            params.encodings = [{}];
                        }
                        params.encodings[0].maxBitrate = 3000000; // 3 Mbps max
                        params.encodings[0].maxFramerate = 30;
                        sender.setParameters(params).catch(e => console.warn("Could not set sender params", e));
                    } catch (e) {
                        console.warn("Could not get/set sender params", e);
                    }
                }
            });
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('C2S_WEBRTC_OFFER', { targetUserId, offer });
        }

        return pc;
    };

    useEffect(() => {
        if (!socket) return;

        const processIceQueue = async (senderId: string, pc: RTCPeerConnection) => {
            const q = pendingCandidates.current.get(senderId);
            if (q && q.length > 0) {
                for (const c of q) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {
                        console.error("Failed to add queued ice candidate", e);
                    }
                }
                pendingCandidates.current.delete(senderId);
            }
        };

        const handleOffer = async ({ senderId, offer }: any) => {
            let pc = peersRef.current.get(senderId);
            
            // If we receive a new offer but we already have a PC, the sender likely restarted their screen share 
            // after closing their previous PC. We MUST destroy the old ghost PC or else the new stream will 
            // crash into a black screen due to fingerprint/ICE mismatch!
            if (pc) {
                pc.close();
                peersRef.current.delete(senderId);
                pendingCandidates.current.delete(senderId);
            }

            pc = await createPeerConnection(senderId);

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await processIceQueue(senderId, pc);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('C2S_WEBRTC_ANSWER', { targetUserId: senderId, answer });
            } catch (error) {
                console.error("Failed to handle WebRTC offer", error);
            }
        };

        const handleAnswer = async ({ senderId, answer }: any) => {
            const pc = peersRef.current.get(senderId);
            if (pc && pc.signalingState === 'have-local-offer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    await processIceQueue(senderId, pc);
                } catch (error) {
                    console.error("Failed to handle WebRTC answer", error);
                }
            } else if (pc) {
                console.warn(`Ignoring answer, PC in state: ${pc.signalingState}`);
            }
        };

        const handleIce = async ({ senderId, candidate }: any) => {
            const pc = peersRef.current.get(senderId);
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            } else {
                // Queue the candidate until remote description is set
                const q = pendingCandidates.current.get(senderId) || [];
                q.push(candidate);
                pendingCandidates.current.set(senderId, q);
            }
        };

        socket.on('S2C_WEBRTC_OFFER', handleOffer);
        socket.on('S2C_WEBRTC_ANSWER', handleAnswer);
        socket.on('S2C_WEBRTC_ICE', handleIce);

        return () => {
            socket.off('S2C_WEBRTC_OFFER', handleOffer);
            socket.off('S2C_WEBRTC_ANSWER', handleAnswer);
            socket.off('S2C_WEBRTC_ICE', handleIce);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !localStream) return;

        const handleUserJoined = (user: any) => {
            if (user.userId !== currentUserId) {
                createPeerConnection(user.userId, localStream);
            }
        };

        const handleUserLeft = (userId: string) => {
            const pc = peersRef.current.get(userId);
            if (pc) {
                pc.close();
                peersRef.current.delete(userId);
            }
            pendingCandidates.current.delete(userId);
        };

        socket.on('S2C_USER_JOINED', handleUserJoined);
        socket.on('S2C_USER_LEFT', handleUserLeft);

        return () => {
            socket.off('S2C_USER_JOINED', handleUserJoined);
            socket.off('S2C_USER_LEFT', handleUserLeft);
        }
    }, [socket, localStream, currentUserId]);

    return { localStream, remoteStream, startScreenShare, stopScreenShare };
};
