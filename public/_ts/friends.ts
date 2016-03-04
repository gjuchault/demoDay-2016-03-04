const $addButton : HTMLButtonElement = <HTMLButtonElement>document.querySelector('.add');
const $addPrompt : Element           = document.querySelector('.friendname');
const $friendName: HTMLInputElement  = <HTMLInputElement>$addPrompt.querySelector('input');

let isPrompting: boolean = false;

$addButton.addEventListener('click', () => {
    if (isPrompting) {
        $addPrompt.classList.remove('active');
        $addButton.textContent = '+';
    } else {
        $addPrompt.classList.add('active');
        $addButton.textContent = '–';
        $friendName.focus();
    }

    isPrompting = !isPrompting;
}, false);

$friendName.addEventListener('keypress', e => {
    if (e.which === 13) {
        const friendName = $friendName.value;

        $friendName.value = '';
        $addPrompt.classList.remove('active');
        $addButton.textContent = '+';

        socket.emit('friend', {
            source: sessionStorage.getItem('name'),
            target: friendName
        });
        isPrompting = false;
    }
}, false);
