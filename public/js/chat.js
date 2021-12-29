const socket = io()

//elements
const $messageForm = document.querySelector('#msg-form')
const $msgInput = $messageForm.querySelector('input')
const $sendButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#msg-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of message container
    const containerHeight = $messages.scrollHeight

    //How  far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable

    $sendButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', e.target.elements.msg.value, (error) => {

        //enable
        $sendButton.removeAttribute('disabled')
        $msgInput.value = ''
        $msgInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click', (e) => {
    e.preventDefault()

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.removeAttribute('disabled')
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared')
        })
    })
})

socket.emit('join', {
    username, room
}, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})
