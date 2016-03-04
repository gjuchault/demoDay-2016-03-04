const $namePrompt : Element          = document.querySelector('.prompt.username');
const $nameInput  : HTMLInputElement = <HTMLInputElement>$namePrompt.querySelector('input');
const $nameDisplay: Element          = document.querySelector('.name');

if (sessionStorage.hasOwnProperty('name')) {
    $nameDisplay.textContent = sessionStorage.getItem('name');
} else {
    $namePrompt.classList.add('active');
    $nameInput.focus();
}

$nameInput.addEventListener('keypress', e => {
    if (e.which === 13) {
        const newName = $nameInput.value;
        sessionStorage.setItem('name', newName);

        $nameDisplay.textContent = newName;
        $nameInput.value = '';

        $namePrompt.classList.remove('active');

        if (!g.hasNode(newName)) {
            socket.emit('user', newName);
        }
    }
}, false);