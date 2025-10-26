document.addEventListener("DOMContentLoaded", () => {
  // --- Sélecteurs ---
  const jalonsList = document.getElementById("jalonsList");
  const messagesTableBody = document.querySelector("#messagesTable tbody");
  const rdvList = document.getElementById("rdvList");
  const autresList = document.getElementById("autresList");
  const livrablesList = document.getElementById("livrablesList");
  const uploadJson = document.getElementById("uploadJson");
  const loadBtn = document.getElementById("loadBtn");
  const uploadStatus = document.getElementById("uploadStatus");

  const generateMailBtn = document.getElementById("generateMailBtn");
  const mailPromptSelect = document.getElementById("mailPromptSelect");

  const mailPrompts = {
    1: "Écris un email professionnel clair et concis pour :",
    2: "Écris un email amical et léger pour :"
  };

  let llmData = null;

  function renderModules() {
    if (!llmData) return;

    // --- Jalons ---
    jalonsList.innerHTML = "";
    if (llmData.jalons?.length) {
      llmData.jalons.forEach(j => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${j.titre || "Sans titre"}</strong> (${j.datePrévue || "N/A"})`;
        if (j.sousActions?.length) {
          const subUl = document.createElement("ul");
          j.sousActions.forEach(s => {
            const subLi = document.createElement("li");
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = s.statut === "fait";
            cb.addEventListener("change", () => s.statut = cb.checked ? "fait" : "à faire");
            subLi.appendChild(cb);
            subLi.appendChild(document.createTextNode(s.texte || "Sans texte"));
            subUl.appendChild(subLi);
          });
          li.appendChild(subUl);
        }
        jalonsList.appendChild(li);
      });
    } else {
      jalonsList.innerHTML = "<li>Aucun jalon à afficher</li>";
    }

    // --- Messages ---
    messagesTableBody.innerHTML = "";
    if (llmData.messages?.length) {
      llmData.messages.forEach(m => {
        const tr = document.createElement("tr");
        const tdCheck = document.createElement("td");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = m.envoyé || false;
        cb.addEventListener("change", () => m.envoyé = cb.checked);
        tdCheck.appendChild(cb);
        tr.appendChild(tdCheck);
        tr.appendChild(document.createElement("td")).textContent = m.destinataire || "-";
        tr.appendChild(document.createElement("td")).textContent = m.sujet || "-";
        tr.appendChild(document.createElement("td")).textContent = m.texte || "-";
        messagesTableBody.appendChild(tr);
      });
    } else {
      messagesTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center">Aucun message à afficher</td></tr>`;
    }

    // --- RDV ---
    rdvList.innerHTML = "";
    if (llmData.rdv?.length) {
      llmData.rdv.forEach(r => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${r.titre || "Sans titre"}</strong> - ${r.date || "N/A"} (${r.durée || "N/A"}) - Participants: ${(r.participants || []).join(", ")}`;
        rdvList.appendChild(li);
      });
    } else {
      rdvList.innerHTML = "<li>Aucun rendez-vous à afficher</li>";
    }

    // --- Autres ressources ---
    autresList.innerHTML = "";
    if (llmData.autresModules?.length) {
      llmData.autresModules.forEach(m => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${m.titre || "Sans titre"}</strong>`;
        if (m.items?.length) {
          const subUl = document.createElement("ul");
          m.items.forEach(it => {
            const subLi = document.createElement("li");
            const a = document.createElement("a");
            a.href = it.lien || "#";
            a.textContent = it.nom || "Sans nom";
            a.target = "_blank";
            subLi.appendChild(a);
            subUl.appendChild(subLi);
          });
          li.appendChild(subUl);
        }
        autresList.appendChild(li);
      });
    } else {
      autresList.innerHTML = "<li>Aucune ressource à afficher</li>";
    }

    // --- Livrables ---
    livrablesList.innerHTML = "";
    if (llmData.livrables?.length) {
      llmData.livrables.forEach(l => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${l.titre}</strong> (${l.type})`;

        const btn = document.createElement("button");
        btn.textContent = "Télécharger Template";
        btn.addEventListener("click", () => generateTemplate(l));
        li.appendChild(document.createTextNode(" "));
        li.appendChild(btn);

        livrablesList.appendChild(li);
      });
    } else {
      livrablesList.innerHTML = "<li>Aucun livrable à afficher</li>";
    }
  }

  // --- Charger JSON ---
  loadBtn.addEventListener("click", () => {
    const file = uploadJson.files[0];
    if (!file) {
      alert("Choisis un fichier JSON LLM !");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        llmData = JSON.parse(e.target.result);
        renderModules();
        uploadStatus.textContent = `Fichier "${file.name}" chargé avec succès !`;
      } catch (err) {
        console.error(err);
        alert("Fichier JSON invalide !");
        uploadStatus.textContent = "";
      }
    };
    reader.readAsText(file);
  });

  // --- Générer Mail GPT ---
  generateMailBtn.addEventListener("click", () => {
    if (!llmData?.messages) return;
    const selectedMessages = llmData.messages.filter(m => m.envoyé);
    if (selectedMessages.length === 0) {
      alert("Coche au moins un message !");
      return;
    }
    const promptId = mailPromptSelect.value;
    const promptTexte = mailPrompts[promptId];
    const content = selectedMessages.map(m =>
      `À: ${m.destinataire || "-"}\nSujet: ${m.sujet || "-"}\nMessage: ${m.texte || "-"}`
    ).join("\n\n");
    const finalPrompt = `${promptTexte}\n\n${content}`;
    navigator.clipboard.writeText(finalPrompt)
      .then(() => alert("Prompt + messages copiés dans le presse-papiers !"))
      .catch(err
