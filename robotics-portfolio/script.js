document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById('app-root');
    const radios = document.querySelectorAll('input[name="order"]');
    const expandBtn = document.getElementById('expand-toggle');
    let dataCache = null;
    let allExpanded = false;

    async function loadData() {
        try {
            const response = await fetch('data.json');
            dataCache = await response.json();
            render();
        } catch (error) {
            console.error("Error:", error);
            root.innerHTML = "<p>Error al cargar datos.</p>";
        }
    }

    function render() {
        const order = document.querySelector('input[name="order"]:checked').id;
        root.innerHTML = '';
        const jobsArray = Object.entries(dataCache);

        jobsArray.sort((a, b) => {
            const yearA = parseInt(a[1].periodo);
            const yearB = parseInt(b[1].periodo);
            return order === 'desc' ? yearB - yearA : yearA - yearB;
        });

        jobsArray.forEach(([puesto, info]) => {
            const jobSection = document.createElement('section');
            jobSection.className = 'job-block';

            const sortedProjects = [...info.proyectos].sort((a, b) => {
                return order === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
            });

            jobSection.innerHTML = `
                <h1 class="job-title">${puesto}</h1>
                <span class="job-meta">${info.empresa} · ${info.periodo}</span>
                <ul class="projects-list">
                    ${sortedProjects.map(proj => `
                        <li class="project-item ${allExpanded ? 'active' : ''}">
                            <div class="project-header" onclick="toggleProject(this)">
                                <h2>${proj.titulo} <small>${proj.fecha}</small></h2>
                                <span class="plus-icon">+</span>
                            </div>
                            <div class="project-detail">
                                <p>${proj.desc}</p>
                                ${proj.video_id ? `
                                    <div class="video-wrapper">
                                        <iframe 
                                            src="https://www.youtube.com/embed/${proj.video_id}" 
                                            title="YouTube video player" 
                                            frameborder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowfullscreen>
                                        </iframe>
                                    </div>
                                ` : ''}
                                ${proj.imagen ? `<img src="images/${proj.imagen}" class="project-img" alt="${proj.titulo}">` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
            root.appendChild(jobSection);
        });
    }

    // Lógica del botón Expandir/Colapsar Todo
    expandBtn.addEventListener('click', () => {
        allExpanded = !allExpanded;
        const items = document.querySelectorAll('.project-item');
        
        items.forEach(item => {
            allExpanded ? item.classList.add('active') : item.classList.remove('active');
        });

        expandBtn.textContent = allExpanded ? "Colapsar todo" : "Expandir todo";
    });

    radios.forEach(r => r.addEventListener('change', () => {
        allExpanded = false; // Reset al reordenar
        expandBtn.textContent = "Expandir todo";
        render();
    }));

    loadData();
});

function toggleProject(element) {
    const item = element.parentElement;
    item.classList.toggle('active');
}