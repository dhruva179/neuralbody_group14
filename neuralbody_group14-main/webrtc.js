document.getElementById('videoFile').addEventListener('change', handleFileSelect, false);

let localStream = null;
let senderPeerConnection = null;
let receiverPeerConnection = null;
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

function handleFileSelect(event) {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    const senderVideoElement = document.getElementById('senderVideo');
    senderVideoElement.src = url;
    senderVideoElement.onloadedmetadata = function(e) {
        senderVideoElement.play();
        startStream(senderVideoElement);
    };
}

async function startStream(videoElement) {
    localStream = videoElement.captureStream();

    // Sender Peer Connection
    senderPeerConnection = new RTCPeerConnection(configuration);
    localStream.getTracks().forEach(track => senderPeerConnection.addTrack(track, localStream));

    // Receiver Peer Connection
    receiverPeerConnection = new RTCPeerConnection(configuration);
    receiverPeerConnection.ontrack = e => {
        document.getElementById('receiverVideo').srcObject = e.streams[0];
    };

    // ICE Candidate exchange
    senderPeerConnection.onicecandidate = e => {
        if (e.candidate) {
            receiverPeerConnection.addIceCandidate(e.candidate);
        }
    };
    receiverPeerConnection.onicecandidate = e => {
        if (e.candidate) {
            senderPeerConnection.addIceCandidate(e.candidate);
        }
    };

    // Create and exchange offer/answer
    const offer = await senderPeerConnection.createOffer();
    await senderPeerConnection.setLocalDescription(offer);
    await receiverPeerConnection.setRemoteDescription(offer);

    const answer = await receiverPeerConnection.createAnswer();
    await receiverPeerConnection.setLocalDescription(answer);
    await senderPeerConnection.setRemoteDescription(answer);
}

window.onunload = window.onbeforeunload = () => {
    if (senderPeerConnection) {
        senderPeerConnection.close();
    }
    if (receiverPeerConnection) {
        receiverPeerConnection.close();
    }
};
