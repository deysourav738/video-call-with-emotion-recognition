const webSocket = new WebSocket("ws://127.0.0.1:3000")
const dict = {
    angry : '0',
    happy : '1',
    neutral : '2',
    sad : '3',
    surprised : '4',
    disgusted : '5',
    fearful : '6'
};
if ('speechSynthesis' in window) {
    var msg = new SpeechSynthesisUtterance()
    msg.rate = 1
    msg.volume = 1
    msg.pitch = 1
    msg.lang = 'en'

    // Speech Synthesis supported
}else{
    // Speech Synthesis Not Supported
    alert("Sorry, your browser doesn't support text to speech!");
}
webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username
function sendUsername() {

    username = document.getElementById("username-input").value
    sendData({
        type: "store_user"
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
function startCall() {
    sendUsername()
    if(username == ""){
        alert("A key is required to place a call")
    }
    else{
        document.getElementById("first").style.display = "none"
        document.getElementById("second").style.display = "block"
        document.getElementById("myInput").value = document.location['href'].replace("sender","receiver")+"?passkey="+username
        document.getElementById("video-call-div")
        .style.display = "inline"

        navigator.getUserMedia({
            video: {
                frameRate: 24,
                width: {
                    min: 480, ideal: 720, max: 1280
                },
                aspectRatio: 1.33333
            },
            audio: true
        }, (stream) => {
            localStream = stream
            document.getElementById("local-video").srcObject = localStream
            let configuration = {
                iceServers: [
                    {
                        "urls": ["stun:stun.l.google.com:19302", 
                        "stun:stun1.l.google.com:19302", 
                        "stun:stun2.l.google.com:19302"]
                    }
                ]
            }

            peerConn = new RTCPeerConnection(configuration)
            peerConn.addStream(localStream)

            peerConn.onaddstream = (e) => {
                document.getElementById("remote-video")
                .srcObject = e.stream
            }

            peerConn.onicecandidate = ((e) => {
                if (e.candidate == null)
                    return
                sendData({
                    type: "store_candidate",
                    candidate: e.candidate
                })
            })

            createAndSendOffer()
        }, (error) => {
            console.log(error)
        })
    }
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then((val) => {
const video = document.getElementById('remote-video')
var prv = ''
video.addEventListener('play', () => {

    setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()
    if(detections['length'] != 0){
        let maxv = -9999
        let maxk = ''
        let obj = detections[0]['expressions']
        Object.keys(obj).forEach(k => {
            if((maxv) <= obj[k]){
                maxv = obj[k]
                maxk = k
            }
        });
        switch(dict[maxk]){
            case "0":
                maxk = "Caller is angry"
                break;
            case "1":
                maxk = "caller is happy"
                break;
            case "2":
                maxk = "caller is neutral"
                break;
            case "3":
                maxk = "caller seems to be sad"
                break;
            case "4":
                maxk = "huh caller is surprised"
                break;
            case "5":
                maxk = "caller is disgust"
                break;
            case "6":
                maxk = "caller is afraid"
                break;
        }
        if(prv != maxk ){
            prv = maxk
            msg.text = maxk
            document.getElementById('alert-box').style.display = "block";
            document.getElementById('alert').innerHTML = maxk
            msg.voice = speechSynthesis.getVoices()[0]
            window.speechSynthesis.speak(msg);
            hideAlert()
        }
    }
    }, 3000)
})
}).catch(error => {
    console.log(error)
  })

  function myFunction() {
    var copyText = document.getElementById("myInput");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Link Copied";
  }
  
  function outFunc() {
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copy to clipboard";
  }
  function hideAlert() {
    setTimeout(function(){ document.getElementById('alert-box').style.display = "none" }, 4000);
  }