// ---------------------------------------------------------------
// Respuestas de cada rompecabezas.
// Edita este objeto cuando definas los rompecabezas reales.
// La comparación ignora mayúsculas/minúsculas y espacios extra.
// ---------------------------------------------------------------
const ANSWERS = {
  1: "1830",
  2: "04 de Septiembre de 2026",
};

const STORAGE_KEY = "plan-secreto-progress";

function normalize(str) {
  return str.trim().toLowerCase();
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  document.dispatchEvent(new CustomEvent("progress-updated"));
}

function markSolved(section) {
  section.classList.add("solved");
  section.querySelector("[data-status]").textContent = "✅ Resuelto";
  section.querySelector("[data-secret]").hidden = false;
}

function setupWheelInputs(form) {
  const wheels = Array.from(form.querySelectorAll("[data-wheel]"));

  function render(wheel) {
    const value = Number(wheel.dataset.value);
    wheel.setAttribute("aria-valuenow", value);
    wheel.querySelector("[data-prev]").textContent = (value + 9) % 10;
    wheel.querySelector("[data-current]").textContent = value;
    wheel.querySelector("[data-next]").textContent = (value + 1) % 10;
  }

  function setValue(wheel, value) {
    wheel.dataset.value = ((value % 10) + 10) % 10;
    render(wheel);
  }

  wheels.forEach((wheel, i) => {
    render(wheel);

    wheel.querySelector(".wheel-up").addEventListener("click", () => {
      setValue(wheel, Number(wheel.dataset.value) + 1);
    });

    wheel.querySelector(".wheel-down").addEventListener("click", () => {
      setValue(wheel, Number(wheel.dataset.value) - 1);
    });

    wheel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setValue(wheel, Number(wheel.dataset.value) + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setValue(wheel, Number(wheel.dataset.value) - 1);
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setValue(wheel, Number(e.key));
        if (wheels[i + 1]) wheels[i + 1].focus();
      }
    });

    wheel.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        setValue(wheel, Number(wheel.dataset.value) + (e.deltaY < 0 ? 1 : -1));
      },
      { passive: false }
    );
  });
}

function getAnswer(form) {
  if (form.dataset.type === "digits") {
    return Array.from(form.querySelectorAll("[data-wheel]"))
      .map((wheel) => wheel.dataset.value)
      .join("");
  }
  if (form.dataset.type === "radio") {
    const checked = form.querySelector("input[type=radio]:checked");
    return checked ? checked.value : "";
  }
  return form.querySelector("input").value;
}

function initPuzzle(section) {
  const id = section.dataset.puzzle;
  const form = section.querySelector("[data-form]");
  const feedback = section.querySelector("[data-feedback]");

  if (form.dataset.type === "digits") {
    setupWheelInputs(form);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (form.dataset.type === "confirm") {
      feedback.textContent = "¡Genial! Sigue con el resto de retos.";
      feedback.className = "feedback ok";
      markSolved(section);

      const progress = loadProgress();
      progress[id] = true;
      saveProgress(progress);
      return;
    }

    const given = normalize(getAnswer(form));
    const expected = normalize(ANSWERS[id] ?? "");

    if (given && given === expected) {
      feedback.textContent = "¡Correcto!";
      feedback.className = "feedback ok";
      markSolved(section);

      const progress = loadProgress();
      progress[id] = true;
      saveProgress(progress);
    } else {
      feedback.textContent = "No es correcto, inténtalo de nuevo.";
      feedback.className = "feedback err";
    }
  });
}

// ---------------------------------------------------------------
// Carrusel: solo se puede avanzar al siguiente rompecabezas una
// vez resuelto el actual.
// ---------------------------------------------------------------
function initCarousel() {
  const puzzles = Array.from(document.querySelectorAll(".carousel .puzzle"));
  const prevBtn = document.querySelector("[data-carousel-prev]");
  const nextBtn = document.querySelector("[data-carousel-next]");
  const dotsContainer = document.querySelector("[data-dots]");

  const dots = puzzles.map((puzzle, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `Ir al rompecabezas ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function unlockedCount() {
    const progress = loadProgress();
    let count = 1;
    for (let i = 0; i < puzzles.length; i++) {
      if (progress[puzzles[i].dataset.puzzle]) {
        count = Math.min(i + 2, puzzles.length);
      } else {
        break;
      }
    }
    return count;
  }

  const firstUnsolved = puzzles.findIndex((p) => !loadProgress()[p.dataset.puzzle]);
  let current = firstUnsolved === -1 ? puzzles.length - 1 : firstUnsolved;

  function render() {
    const progress = loadProgress();
    const unlocked = unlockedCount();

    puzzles.forEach((p, i) => p.classList.toggle("active", i === current));
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
      dot.classList.toggle("solved", !!progress[puzzles[i].dataset.puzzle]);
      dot.disabled = i >= unlocked;
    });
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= unlocked - 1;
  }

  function goTo(index) {
    if (index < 0 || index >= puzzles.length) return;
    if (index >= unlockedCount()) return;
    current = index;
    render();
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
  document.addEventListener("progress-updated", render);

  render();
}

function restoreProgress() {
  const progress = loadProgress();
  document.querySelectorAll(".puzzle").forEach((section) => {
    const id = section.dataset.puzzle;
    if (progress[id]) {
      markSolved(section);
    }
  });
}

document.querySelectorAll(".puzzle").forEach(initPuzzle);
restoreProgress();
initCarousel();

document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("¿Reiniciar todo el progreso?")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});
