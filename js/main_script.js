document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('carousel-track');
    const items = document.querySelectorAll('.carousel-item');
    const carouselContainer = document.getElementById('photo-carousel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (!track || items.length === 0) return; // Sai se não houver carrossel

    let currentIndex = 0;
    const itemWidth = 400;
    
    // Calcula a largura total para o track
    track.style.width = `${itemWidth * items.length}px`;

    items.forEach(item => {
        item.style.width = `${itemWidth}px`;
    });

    function updateCarousel() {
        const offset = -currentIndex * itemWidth;
        track.style.transform = `translateX(${offset}px)`;
        
        // Esconde ou mostra os botões nas extremidades
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
        nextBtn.style.display = currentIndex === items.length - 1 ? 'none' : 'block';
    }

    // Navegação
    nextBtn.addEventListener('click', () => {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    // Inicia o carrossel na primeira foto e esconde o botão "Anterior"
    updateCarousel();

    // Reajusta o carrossel em caso de redimensionamento da janela
    window.addEventListener('resize', updateCarousel);
});
// VARIÁVEL GLOBAL PARA RASTREAR O PLAYER ATIVO
let currentAudio = null;

function playTrack(trackId, button) {
    // Note que os arquivos de áudio devem ser: track_1.mp3, track_2.mp3, etc.
    const audioSrc = `assets/musicas/${trackId}.mp3`;
    
    // 1. Gerencia o Áudio Ativo (Pausa o anterior se necessário)
    if (currentAudio) {
        if (currentAudio.src.includes(trackId)) {
            currentAudio.pause();
            currentAudio = null;
            button.textContent = '▶';
            return;
        } else {
            currentAudio.pause();
            const playingBtn = document.querySelector('.playing-btn');
            if (playingBtn) playingBtn.textContent = '▶'; 
        }
    }

    // 2. Cria e Toca
    const newAudio = new Audio(audioSrc);
    newAudio.volume = 0.6; 
    newAudio.play();
    
    // 3. Atualiza o Estado
    currentAudio = newAudio;
    button.textContent = '⏸';
    
    // Remove a classe playing-btn do botão anterior e adiciona ao novo
    document.querySelectorAll('.play-btn').forEach(btn => btn.classList.remove('playing-btn'));
    button.classList.add('playing-btn');

    // 4. Limpa quando a música termina
    newAudio.onended = () => {
        button.textContent = '▶';
        button.classList.remove('playing-btn');
        currentAudio = null;
    };
}
// Lógica para adicionar os listeners de click nos botões
document.addEventListener('DOMContentLoaded', () => {
    // ... (Código do carrossel, se houver) ...

    // NOVO: Funcionalidade de Player para todas as 5 músicas
    const playButtons = document.querySelectorAll('.play-btn');

    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Pega o valor do atributo data-track (ex: 'track_1')
            const trackId = button.getAttribute('data-track'); 
            playTrack(trackId, button);
        });
    });
});