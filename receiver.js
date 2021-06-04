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
        case "offer":
            peerConn.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

function createAndSendAnswer () {
    peerConn.createAnswer((answer) => {
        peerConn.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error => {
        console.log(error)
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
let username

function joinCall() {

    username = document.getElementById("username-input").value
    if(username == ""){
        alert("A key is required to join a call")
    }
    else{
        document.getElementById("first").style.display = "none"
        document.getElementById("second").style.display = "block"
        document.getElementById("myInput").value = username
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
                    type: "send_candidate",
                    candidate: e.candidate
                })
            })

            sendData({
                type: "join_call"
            })

        }, (error) => {
            console.log(error)
        })
    }
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
    /*const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)*/
    setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()
    /*const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)*/
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

  window.addEventListener('load',() => {
      const params = (new URL(document.location['href'])).searchParams
      const name = params.get('passkey')
      if( name != null){
      if(name != ""){
          document.getElementById("username-input").value = name
          joinCall()
      }
    }
  });

   function hideAlert() {
    setTimeout(function(){ document.getElementById('alert-box').style.display = "none" }, 4000);
  }