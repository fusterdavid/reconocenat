document.addEventListener('DOMContentLoaded', () => {
    const imageElement = document.getElementById('species-image');
    const imageAttributionElement = document.getElementById('image-attribution');
    const kingdomSelect = document.getElementById('kingdom-select');
    const speciesInput = document.getElementById('species-input');
    const submitButton = document.getElementById('submit-button');
    const ecodinerDisplay = document.getElementById('ecodiner');
    const feedbackMessage = document.getElementById('feedback-message');

    let currentEcodiner = 0;
    let currentObservation = null;

    // --- iNaturalist API configurada para 100 km alrededor de Catriel, Río Negro ---
    const INATURALIST_API_URL = 'https://api.inaturalist.org/v1/observations?quality_grade=research&photos=true&licensed=true&license=cc-by,cc-by-nc,cc0&taxon_id=1,47126,47170&per_page=50&order=desc&order_by=created_at&locale=es&lat=-37.877778&lng=-67.791667&radius=100';

    async function fetchNewObservation() {
        feedbackMessage.textContent = 'Cargando nueva imagen...';
        submitButton.disabled = true;
        imageElement.src = 'placeholder.jpg';
        imageAttributionElement.textContent = '';

        try {
            const response = await fetch(INATURALIST_API_URL);
            if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                currentObservation = data.results[randomIndex];

                if (currentObservation.photos && currentObservation.photos.length > 0) {
                    let imageUrl = currentObservation.photos[0].url;
                    if (imageUrl) {
                        if (imageUrl.includes('/square.')) {
                            imageUrl = imageUrl.replace('/square.', '/medium.');
                        }
                    } else {
                        const photoId = currentObservation.photos[0].id;
                        const extension = currentObservation.photos[0].original_dimensions ? 'jpg' : 'jpeg';
                        imageUrl = `https://static.inaturalist.org/photos/${photoId}/medium.${extension}`;
                    }

                    imageElement.src = imageUrl;
                    imageAttributionElement.innerHTML = `Foto por: <a href="https://www.inaturalist.org/observations/${currentObservation.id}" target="_blank">${currentObservation.user.login}</a> en iNaturalist (${currentObservation.photos[0].license_code || 'Licencia no especificada'})`;

                    kingdomSelect.value = "";
                    speciesInput.value = "";
                    feedbackMessage.textContent = "";
                } else {
                    throw new Error('La observación no tiene fotos.');
                }
            } else {
                throw new Error('No se encontraron observaciones.');
            }
        } catch (error) {
            console.error('Error al obtener observación de iNaturalist:', error);
            feedbackMessage.textContent = `Error al cargar: ${error.message}. Intentando de nuevo...`;
            setTimeout(fetchNewObservation, 10000);
        } finally {
            submitButton.disabled = false;
        }
    }

    function checkAnswer() {
        if (!currentObservation) {
            feedbackMessage.textContent = 'No hay imagen cargada para verificar.';
            return;
        }

        const selectedKingdom = kingdomSelect.value;
        const enteredSpecies = speciesInput.value.trim().toLowerCase();

        let correctKingdom = currentObservation.taxon.iconic_taxon_name || 'Desconocido';
        if (['Amphibia', 'Reptilia', 'Aves', 'Mammalia', 'Actinopterygii', 'Mollusca', 'Insecta', 'Arachnida'].includes(correctKingdom)) {
            correctKingdom = 'Animalia';
        }

        const scientificName = currentObservation.taxon.name.toLowerCase();
        const commonName = (currentObservation.taxon.preferred_common_name || '').toLowerCase();

        const isKingdomCorrect = selectedKingdom.toLowerCase() === correctKingdom.toLowerCase();
        const isSpeciesCorrect = enteredSpecies === scientificName || (commonName && enteredSpecies === commonName);

        if (isKingdomCorrect && isSpeciesCorrect) {
            feedbackMessage.textContent = '¡Correcto! Ambas respuestas son acertadas.';
            feedbackMessage.className = 'correct';
            currentEcodiner += 10;
            setTimeout(fetchNewObservation, 2000);
        } else if (isKingdomCorrect) {
            feedbackMessage.textContent = `¡Reino Correcto! Pero la especie es incorrecta. La especie era: ${currentObservation.taxon.name}${commonName ? ` (${commonName})` : ''}`;
            feedbackMessage.className = 'incorrect';
            currentEcodiner += 2;
            setTimeout(fetchNewObservation, 10000);
        } else if (isSpeciesCorrect) {
            feedbackMessage.textContent = `¡Especie Correcta! Pero el reino es incorrecto. El reino era: ${correctKingdom}`;
            feedbackMessage.className = 'incorrect';
            currentEcodiner += 5;
            setTimeout(fetchNewObservation, 10000);
        } else {
            feedbackMessage.textContent = `Incorrecto. El reino era "${correctKingdom}" y la especie "${currentObservation.taxon.name}${commonName ? ` (${commonName})` : ''}".`;
            feedbackMessage.className = 'incorrect';
            setTimeout(fetchNewObservation, 10000);
        }

        ecodinerDisplay.textContent = currentEcodiner;
        speciesInput.value = '';
    }

    submitButton.addEventListener('click', checkAnswer);
    fetchNewObservation();
});

