const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('#input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate =  document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
     const $newMessage = $messages.lastElementChild

     const messageStyles = getComputedStyle($newMessage)
     const messageMargin = parseInt(messageStyles.marginBottom)
     const messageHeight = $newMessage.offsetHeight + messageMargin
     
     const visibleHeight = $messages.offsetHeight
     const containerHeight = $messages.scrollHeight
     const scrollOffset = $messages.scrollTop + visibleHeight

     if (containerHeight - messageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
     }
}


socket.on('welcomeMessage', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)    
    autoscroll()
})

socket.on('locationMessage', (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    let message = $messageFormInput.value
    
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message Delivered!')
    })
})

$locationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    
    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.removeAttribute('disabled')

         socket.emit('shareLocation', {
             latitude: position.coords.latitude,
             longitude: position.coords.longitude
            }, () => {
                console.log('Location shared!')
            })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})