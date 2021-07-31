var Demo = (function(){


    var _audioTrack;
    var _videoTrack = null;
    var _screenTrack = null;

    var _mediaRecorder;
    var _recordedChunks = [];

    var connection = null;
    var _remoteStream = new MediaStream();

    var _localVideo;

    var _rtpSender;
var socket=io('http://localhost:3000')
async function _init() {

    _localVideo = document.getElementById('videoCtr');

    eventBinding();
}
function eventBinding() {
    $("#btnMuteUnmute").on('click', function () {
        if (!_audioTrack) return;

        if (_audioTrack.enabled == false) {
            _audioTrack.enabled = true;
            $(this).text("Mute");
        }
        else {
            _audioTrack.enabled = false;
            $(this).text("Unmute");
        }
        
    });
    $("#btnStartStopCam").on('click', async function () {

        if (_videoTrack) {
            _videoTrack.stop();
            _videoTrack = null;
            _localVideo.srcObject = null;
            $("#btnStartStopCam").text("Start Camera");

            if (_rtpSender && connection) {
                connection.removeTrack(_rtpSender);
                _rtpSender = null;
            }

            return;
        }
        try {
            var vstream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 200,
                    height: 200
                },
                audio: false
            });
            if (vstream && vstream.getVideoTracks().length > 0) {
                _videoTrack = vstream.getVideoTracks()[0];
                setLocalVideo(true);
                //_localVideo.srcObject = new MediaStream([_videoTrack]);
                $("#btnStartStopCam").text("Stop Camera");
            }
            //debugger;
            //if (_rtpSender && _rtpSender.track && _videoTrack && connection) {
            //    _rtpSender.replaceTrack(_videoTrack);
            //}
            //else {
            //    if (_videoTrack && connection)
            //        _rtpSender = connection.addTrack(_videoTrack);
            //}


        } catch (e) {
            
            return;
        }
    });
    $("#startConnection").on('click', async function () {
        await startwithAudio();
        await _createConnection();
        //await _createOffer();
    });
}
async function startwithAudio() {

    try {
        var astream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

        _audioTrack = astream.getAudioTracks()[0];

        _audioTrack.onmute = function (e) {
            
        }
        _audioTrack.onunmute = function (e) {
            
        }

        _audioTrack.enabled = false;

    } catch (e) {
        
        return;
    }
}
function setLocalVideo(isVideo) {
    var currtrack;

    if (isVideo) {
        if (_screenTrack) 
            $("#btnStartStopScreenshare").trigger('click');
        
        if (_videoTrack) {
            _localVideo.srcObject = new MediaStream([_videoTrack]);
            currtrack = _videoTrack;
        }
        
    }
    else {
        if (_videoTrack)
            $("#btnStartStopCam").trigger('click');

        if (_screenTrack) {
            _localVideo.srcObject = new MediaStream([_screenTrack]);
            currtrack = _screenTrack;
        }
    }

    if (_rtpSender && _rtpSender.track && currtrack && connection) {
        _rtpSender.replaceTrack(currtrack);
    }
    else {
        if (currtrack && connection)
            _rtpSender = connection.addTrack(currtrack);
    }
}
socket.on("new_message1", async function (message) {
  
    message = JSON.parse(message);

    if (message.rejected) {
        alert('other user rejected');
    }
    else if (message.answer) {
        
        await connection.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
    else if (message.offer) {
       
        var r = true;

        if (!_audioTrack) {
            r = confirm('want to continue?');
            if (r) {
                await startwithAudio();
                if (_audioTrack) {
                    connection.addTrack(_audioTrack);
                }
            }
            else {
                
                socket.emit('new_message1',JSON.stringify({ 'rejected': 'true' }));
            }
        }
        if (_audioTrack) {

            if (!connection) {
                await _createConnection();
            }

            await connection.setRemoteDescription(new RTCSessionDescription(message.offer));
            var answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            socket.emit('new_message1',JSON.stringify({ 'answer': answer }));
        }
    }
    else if (message.iceCandidate) {
        
        if (!connection) {
            await _createConnection();
        }
        try {
            await connection.addIceCandidate(message.iceCandidate);
        } catch (e) {
            
        }
    }
});
async function _createConnection() {

    

    connection = new RTCPeerConnection(null);
    connection.onicecandidate = function (event) {
       
        if (event.candidate) {
            socket.emit('new_message1',JSON.stringify({ 'iceCandidate': event.candidate }));
        }
    }
    connection.onicecandidateerror = function (event) {
       

    }
    connection.onicegatheringstatechange = function (event) {
       
    };
    connection.onnegotiationneeded = async function (event) {
        await _createOffer();
    }
    connection.onconnectionstatechange = function (event) {
        
        //if (connection.connectionState === "connected") {
        //    console.log('connected')
        //}
    }
    // New remote media stream was added
    connection.ontrack = function (event) {

        
        if (!_remoteStream)
            _remoteStream = new MediaStream();

        if (event.streams.length > 0) {
            
            //_remoteStream = event.streams[0];
        }

        if (event.track.kind == 'video') {
            _remoteStream.getVideoTracks().forEach(t => _remoteStream.removeTrack(t));
        }

        _remoteStream.addTrack(event.track);

        

        var newVideoElement = document.getElementById('remoteVideoCtr');


        newVideoElement.srcObject = null;
        newVideoElement.srcObject = _remoteStream;
        newVideoElement.load();
        //newVideoElement.play();
    };

    
    if (_videoTrack) {
        _rtpSender = connection.addTrack(_videoTrack);
    }

    if (_screenTrack) {
        _rtpSender = connection.addTrack(_screenTrack);
    }

    if (_audioTrack) {
        connection.addTrack(_audioTrack, _remoteStream);
    }

}
async function _createOffer() {
    var offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    
    //Send offer to Server
    socket.emit('new_message1',JSON.stringify({ 'offer': connection.localDescription }));
}


return {
    init: async function () {
        await _init();
    }
}













}())