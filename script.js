const flashcardElement = document.getElementById("flashcard");
const frontFace = flashcardElement.querySelector(".card-face.front");
const backFace = flashcardElement.querySelector(".card-face.back");

let flashcards = [
    { q: "What does HTML stand for?", a: "HyperText Markup Language" },
    { q: "What is the purpose of CSS?", a: "To style HTML content" },
    { q: "What does JS stand for?", a: "JavaScript" }
];

let currentIndex = 0;
let currentSetName = null;
let setSelectTimer = null;

function loadCard() {
    const card = flashcards[currentIndex];
    if (!card) {
        frontFace.innerText = "No flashcards available";
        backFace.innerText = "";
        flashcardElement.classList.remove("flipped");
        document.getElementById("cardCounter").innerText = `0/0`;
        return;
    }
    frontFace.innerText = card.q;
    backFace.innerText = card.a;
    document.getElementById("cardCounter").innerText = `${currentIndex + 1}/${flashcards.length}`;
    flashcardElement.classList.remove("flipped");
}

function flipCard() {
    flashcardElement.classList.toggle("flipped");
}

function nextCard() {
    if (flashcardElement.classList.contains("flipped")) {
        flashcardElement.addEventListener("transitionend", function handler() {
            currentIndex = (currentIndex + 1) % flashcards.length;
            loadCard();
            flashcardElement.removeEventListener("transitionend", handler);
        }, { once: true });
        flashcardElement.classList.remove("flipped");
    } else {
        currentIndex = (currentIndex + 1) % flashcards.length;
        loadCard();
    }
}

function prevCard() {
    if (flashcardElement.classList.contains("flipped")) {
        flashcardElement.addEventListener("transitionend", function handler() {
            currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
            loadCard();
            flashcardElement.removeEventListener("transitionend", handler);
        }, { once: true });
        flashcardElement.classList.remove("flipped");
    } else {
        currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
        loadCard();
    }
}



function getFlashcardsSets() {
    const sets = localStorage.getItem("flashcardSets");
    return sets ? JSON.parse(sets) : {};
}

function saveFlashcardSets(sets) {
    localStorage.setItem("flashcardSets", JSON.stringify(sets));
}

function addFlashcardSet(newSet) {
    const sets = getFlashcardsSets();
    sets[newSet.name] = newSet.cards;
    saveFlashcardSets(sets);
}

function deleteFlashcardSet(name) {
    const sets = getFlashcardsSets();
    delete sets[name];
    saveFlashcardSets(sets);
    if (currentSetName === name) {
        currentSetName = null;
    }
    renderSetOptions();
    loadSelectedSet();
}

function updateFlashcardSet(id, updatedSet) {
    const sets = getFlashcardsSets();
    sets[id] = updatedSet.cards;
    saveFlashcardSets(sets);
}

function createNewSet() {
    const setName = document.getElementById("setName").value.trim();
    const setContent = document.getElementById("setContent").value.trim();

    if (!setName || !setContent) {
        alert("Please provide both a set name and content.");
        return;
    }

    if (getFlashcardsSets().hasOwnProperty(setName)) {
        alert(`A set named "${setName}" already exists. Please choose a different name.`);
        return;
    }

    const cards = setContent.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const [q, a] = line.split(" - ");
            return { q: q?.trim(), a: a?.trim() };
        })
        .filter(card => card.q && card.a);

    if (cards.length === 0) {
        alert("Please provide valid flashcard content in the format 'Question - Answer'.");
        return;
    }

    const newSet = { name: setName, cards: cards };
    addFlashcardSet(newSet);
    alert(`Set "${setName}" created successfully!`);
    currentSetName = setName;
    renderSetOptions();
    loadSelectedSet();
    closeAddSetModal();
}

function selectSet(name) {
    currentSetName = name;
    renderSetOptions();
    loadSelectedSet();
}

function loadSelectedSet() {
    const sets = getFlashcardsSets();
    if (currentSetName && sets[currentSetName]) {
        flashcards = sets[currentSetName];
        currentIndex = 0;
        loadCard();
    }else {
        flashcards = [];
        frontFace.innerText = "No flashcards available";
        backFace.innerText = "";
        flashcardElement.classList.remove("flipped");
    }
    renderSetPreview();
}

function renderSetOptions() {
    const flashcardSetsList = document.getElementById("flashcardSetsList");
    flashcardSetsList.innerHTML = "";
    const sets = getFlashcardsSets();
    const setNames = Object.keys(sets);

    if (setNames.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.classList.add("text-muted");
        emptyItem.textContent = "No flashcard sets available";
        flashcardSetsList.appendChild(emptyItem);
        currentSetName = null;
        return;
    }

    if (!currentSetName || !sets.hasOwnProperty(currentSetName)) {
        currentSetName = setNames[0];
    }

    for (const setName of setNames) {
        const setItem = document.createElement("li");
        setItem.classList.add("set-item", "fade-in");
        if (setName === currentSetName) {
            setItem.classList.add("selected");
        }
        setItem.ondblclick = function() {
            clearTimeout(setSelectTimer);

            const input = document.createElement("input");
            input.type = "text";
            input.value = setName;
            input.classList.add("edit-input");
            setItem.replaceChild(input, setItem.firstChild);
            input.focus();

            input.onblur = function() {
                const newSetName = input.value.trim();
                if (newSetName && newSetName !== setName) {
                    const sets = getFlashcardsSets();
                    if (sets.hasOwnProperty(newSetName)) {
                        alert(`A set named "${newSetName}" already exists. Please choose a different name.`);
                        renderSetOptions();
                        return;
                    }
                    sets[newSetName] = sets[setName];
                    delete sets[setName];
                    saveFlashcardSets(sets);
                    if (currentSetName === setName) {
                        currentSetName = newSetName;
                    }
                    renderSetOptions();
                    loadSelectedSet();
                } else {
                    renderSetOptions();
                }
            };
        };
        setItem.onclick = function() {
            clearTimeout(setSelectTimer);
            setSelectTimer = setTimeout(function() {
                selectSet(setName);
            }, 250);
        };
        

        const setInfo = document.createElement("span");
        setInfo.classList.add("flex-row", "items-center", "gap-sm");

        const label = document.createElement("span");
        label.classList.add("truncate");
        label.textContent = setName;
        setInfo.appendChild(label);

        const countBadge = document.createElement("span");
        countBadge.classList.add("badge");
        countBadge.textContent = `${sets[setName].length} cards`;
        setInfo.appendChild(countBadge);

        setItem.appendChild(setInfo);

        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = "×";
        deleteBtn.classList.add("delete-icon");
        deleteBtn.onclick = function(event) {
            event.stopPropagation();
            if (confirm(`Are you sure you want to delete the set "${setName}"?`)) {
                deleteFlashcardSet(setName);
            }
        };
        setItem.appendChild(deleteBtn);

        flashcardSetsList.appendChild(setItem);
    }
}


function renderSetPreview() {
    const setList = document.getElementById("flashcardItems");
    setList.innerHTML = "";
    const currentSet = getFlashcardsSets()[currentSetName];

    if (!currentSet || currentSet.length === 0) {
        const listItem = document.createElement("li");
        listItem.classList.add("text-muted");
        listItem.textContent = "No flashcards in this set.";
        setList.appendChild(listItem);
        return;
    }
    if (currentSet) {
        currentSet.forEach((card, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("fade-in");
            
            const cardContent = document.createElement("span");
            cardContent.classList.add("truncate");
            cardContent.textContent = `${card.q} - ${card.a}`;
            listItem.appendChild(cardContent);
            listItem.dataset.index = index;

            cardContent.ondblclick = function() {
                const input = document.createElement("input");
                input.type = "text";
                input.value = `${card.q} - ${card.a}`;
                input.classList.add("edit-input");
                listItem.replaceChild(input, cardContent);
                input.focus();

                input.onblur = function() {
                    const [newQ, newA] = input.value.split(" - ").map(s => s.trim());
                    if (newQ && newA) {
                        const sets = getFlashcardsSets();
                        sets[currentSetName][index] = { q: newQ, a: newA };
                        saveFlashcardSets(sets);
                        loadSelectedSet();
                    } else {
                        alert("Please provide both a question and an answer.");
                        listItem.replaceChild(cardContent, input);
                    }
                }

            }; 

            const deleteBtn = document.createElement("span");
            deleteBtn.textContent = "×";
            deleteBtn.classList.add("delete-icon");
            deleteBtn.onclick = function() {
                const sets = getFlashcardsSets();
                sets[currentSetName].splice(index, 1);
                saveFlashcardSets(sets);
                loadSelectedSet();
            }


            listItem.appendChild(deleteBtn);
            setList.appendChild(listItem);
        });
    }
}

function openAddSetModal() {
    document.getElementById("addSetModal").classList.remove("hidden");
}

function closeAddSetModal() {
    document.getElementById("addSetModal").classList.add("hidden");
    document.getElementById("setName").value = "";
    document.getElementById("setContent").value = "";
}

function addNewCard() {
    if (!currentSetName) {
        alert("Please create or select a set before adding a card.");
        closeAddCardModal();
        return;
    }

    const question = document.getElementById("cardQuestion").value.trim();
    const answer = document.getElementById("cardAnswer").value.trim();

    if (!question || !answer) {
        alert("Please provide both a question and an answer.");
        return;
    }

    const newCard = { q: question, a: answer };
    const sets = getFlashcardsSets();
    if (!sets[currentSetName]) {
        sets[currentSetName] = [];
    }
    sets[currentSetName].push(newCard);
    saveFlashcardSets(sets);
    loadSelectedSet();
    closeAddCardModal();
}

function openAddCardModal() {
    document.getElementById("addCardModal").classList.remove("hidden");
}

function closeAddCardModal() {
    document.getElementById("addCardModal").classList.add("hidden");
    document.getElementById("cardQuestion").value = "";
    document.getElementById("cardAnswer").value = "";
}

loadCard();
renderSetOptions();
loadSelectedSet();