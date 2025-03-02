// platforms.js

import { updateGamePlatformColor } from "../services/storage.js";
import { updatePlatformColors } from "./ui.js";

export const Platforms = {
  list: [],
  currentUser: null,

  async init(user) {
    console.time("Platforms.init");
    this.currentUser = user;
    await this.loadPlatforms();
    this.addEventListeners();
  },

  async loadPlatforms() {
    console.time("loadPlatforms");
    if (!this.currentUser) {
      console.error("No user logged in");
      return;
    }
    const snapshot = await window.db
      .collection("platforms")
      .where("userId", "==", this.currentUser.uid)
      .get();
    this.list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async addPlatform(name, color) {
    if (!this.currentUser) {
      console.error("No user logged in");
      return;
    }
    const platform = { name, color, userId: this.currentUser.uid };
    await window.db.collection("platforms").add(platform);
    await this.loadPlatforms();
    this.renderPlatformList();
  },

  async updatePlatformColor(id, newColor) {
    if (!this.currentUser) {
      console.error("No user logged in");
      return;
    }
    const platform = this.list.find((p) => p.id === id);
    if (!platform) {
      console.error("Platform not found");
      return;
    }
    await window.db.collection("platforms").doc(id).update({ color: newColor });
    await updateGamePlatformColor(platform.name, newColor);
    await this.loadPlatforms();
    this.renderPlatformList();
    updatePlatformColors(platform.name, newColor);
    return newColor;
  },

  async deletePlatform(id) {
    if (!this.currentUser) {
      console.error("No user logged in");
      return;
    }
    await window.db.collection("platforms").doc(id).delete();
    await this.loadPlatforms();
    this.renderPlatformList();
  },

  renderPlatformList() {
    const platformList = document.getElementById("platformList");
    platformList.innerHTML = this.list
      .map(
        (platform) => `
            <li>
                <div class="color-picker-wrapper" style="background-color: ${platform.color};" data-id="${platform.id}">
                  <input type="color" class="color-picker" data-id="${platform.id}" value="${platform.color}">
                </div>
                <span class="platform-name">${platform.name}</span>
                <button class="delete-platform" data-id="${platform.id}">Slet</button>
            </li>
        `
      )
      .join("");
  },

  addEventListeners() {
    const addPlatformForm = document.getElementById("addPlatformForm");
    const colorInput = document.getElementById("platformColor");
    const colorPreview = document.querySelector(".color-preview");
    const platformList = document.getElementById("platformList");

    // Fjern eksisterende event listeners før tilføjelse af nye
    colorInput.removeEventListener("input", this._handleColorInput);
    colorPreview.removeEventListener("click", this._handleColorPreviewClick);
    addPlatformForm.removeEventListener("submit", this._handleFormSubmit);
    platformList.removeEventListener("click", this._handlePlatformListClick);
    platformList.removeEventListener("change", this._handlePlatformListChange);

    // Gem referencer til event handler funktioner, så vi kan fjerne dem senere
    this._handleColorInput = (e) => {
      colorPreview.style.backgroundColor = e.target.value;
    };

    this._handleColorPreviewClick = () => {
      colorInput.click();
    };

    this._handleFormSubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("platformName").value;
      const color = colorInput.value;
      this.addPlatform(name, color);
      e.target.reset();
      colorPreview.style.backgroundColor = "";
    };

    // Event delegation for platformList
    this._handlePlatformListClick = (e) => {
      // Håndter delete knapper
      if (e.target.classList.contains("delete-platform")) {
        const id = e.target.dataset.id;
        this.deletePlatform(id);
      } 
      // Håndter color-picker-wrapper
      else if (e.target.classList.contains("color-picker-wrapper")) {
        const colorPicker = e.target.querySelector(".color-picker");
        if (colorPicker) {
          colorPicker.click();
        }
      }
    };

    // Event delegation for farveændringer
    this._handlePlatformListChange = (e) => {
      if (e.target.classList.contains("color-picker")) {
        const id = e.target.dataset.id;
        const newColor = e.target.value;
        this.updatePlatformColor(id, newColor);
      }
    };

    // Tilføj event listeners
    colorInput.addEventListener("input", this._handleColorInput);
    colorPreview.addEventListener("click", this._handleColorPreviewClick);
    addPlatformForm.addEventListener("submit", this._handleFormSubmit);
    platformList.addEventListener("click", this._handlePlatformListClick);
    platformList.addEventListener("change", this._handlePlatformListChange);
  },

  getPlatformSelectOptions() {
    return this.list
      .map(
        (platform) => `
            <option value="${platform.id}">${platform.name}</option>
        `
      )
      .join("");
  },
};