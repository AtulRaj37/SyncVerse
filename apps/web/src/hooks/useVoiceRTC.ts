"use client";

import { useState, useEffect, useRef } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { useUserStore } from '@/store/useUserStore';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export function useVoiceRTC() {
    const { socket, roomState } = useSocketStore();
    const { id: currentUserId } = useUserStore();
    
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    
    // local stream for the microphone
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    // Map of incoming audio streams
    // { peerId: MediaStream }
    const [remoteAudioStreams, setRemoteAudioStreams] = useState<Map<string, MediaStream>>(new Map());

    const createAudioConnection = (peerId: string, stream?: MediaStream | null) => {
        if (peerConnections.current.has(peerId)) return peerConnections.current.get(peerId)!;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnections.current.set(peerId, pc);

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('C2S_VOICE_ICE', { targetUserId: peerId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteAudioStreams(prev => {
                const map = new Map(prev);
                map.set(peerId, event.streams[0]);
                return map;
            });
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                pc.close();
                peerConnections.current.delete(peerId);
                setRemoteAudioStreams(prev => {
                    const map = new Map(prev);
                    map.delete(peerId);
                    return map;
                });
            }
        };

        return pc;
    };

    // Called when user clicks "Unmute" (joins voice chat actively to speak)
    const toggleVoice = async () => {
        if (!socket || !roomState) return;

        if (isVoiceActive) {
            // Mute / Leave Active Sender role
            localStream?.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            setIsVoiceActive(false);
            
            // Close all active connections, they will be renegotiated if someone else is speaking
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
            setRemoteAudioStreams(new Map());

            socket.emit('C2S_LEAVE_VOICE');
        } else {
            // Unmute / Join Active Sender role
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                setLocalStream(stream);
                setIsVoiceActive(true);
                socket.emit('C2S_JOIN_VOICE');

                // Send Offers to everyone in room to establish audio channel
                Object.keys(roomState.users).forEach(async (userId) => {
                    if (userId !== currentUserId) {
                        const pc = createAudioConnection(userId, stream);
                        const offer = await pc.createOffer({ offerToReceiveAudio: true });
                        await pc.setLocalDescription(offer);
                        socket.emit('C2S_VOICE_OFFER', { targetUserId: userId, offer });
                    }
                });

            } catch (err) {
                console.error("Microphone access denied:", err);
            }
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleOffer = async ({ senderId, offer }: { senderId: string, offer: any }) => {
            // If someone sends an offer, create a connection and answer.
            // Pass localStream if we're active so it becomes a 2-way call.
            const pc = createAudioConnection(senderId, localStream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('C2S_VOICE_ANSWER', { targetUserId: senderId, answer });
        };

        const handleAnswer = async ({ senderId, answer }: { senderId: string, answer: any }) => {
            const pc = peerConnections.current.get(senderId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleIce = async ({ senderId, candidate }: { senderId: string, candidate: any }) => {
            const pc = peerConnections.current.get(senderId);
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const handleLeave = (userId: string) => {
            const pc = peerConnections.current.get(userId);
            if (pc) {
                pc.close();
                peerConnections.current.delete(userId);
            }
            setRemoteAudioStreams(prev => {
                const map = new Map(prev);
                map.delete(userId);
                return map;
            });
        };

        // When someone joins voice, we (if active) should proactively establish connection to them 
        // to ensure robust 2-way meshes. Usually the new sender initiates, but to avoid race conditions:
        const handleJoinVoice = async (userId: string) => {
            if (isVoiceActive && localStream && userId !== currentUserId) {
                const pc = createAudioConnection(userId, localStream);
                const offer = await pc.createOffer({ offerToReceiveAudio: true });
                await pc.setLocalDescription(offer);
                socket.emit('C2S_VOICE_OFFER', { targetUserId: userId, offer });
            }
        };

        socket.on('S2C_VOICE_OFFER', handleOffer);
        socket.on('S2C_VOICE_ANSWER', handleAnswer);
        socket.on('S2C_VOICE_ICE', handleIce);
        socket.on('S2C_USER_LEFT_VOICE', handleLeave);
        socket.on('S2C_USER_JOINED_VOICE', handleJoinVoice);

        return () => {
            socket.off('S2C_VOICE_OFFER', handleOffer);
            socket.off('S2C_VOICE_ANSWER', handleAnswer);
            socket.off('S2C_VOICE_ICE', handleIce);
            socket.off('S2C_USER_LEFT_VOICE', handleLeave);
            socket.off('S2C_USER_JOINED_VOICE', handleJoinVoice);
        };
    }, [socket, localStream, isVoiceActive]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (socket) {
                socket.emit('C2S_LEAVE_VOICE');
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            peerConnections.current.forEach(pc => pc.close());
        };
    }, []);

    return {
        isVoiceActive,
        toggleVoice,
        remoteAudioStreams
    };
}
