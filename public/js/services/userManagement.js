// userManagement.js

export const UserManagement = {
  async createOrUpdateUser(user, displayName = null) {
    const userRef = window.db.collection("users").doc(user.uid);

    try {
      const doc = await userRef.get();
      if (!doc.exists) {
        // Opret ny bruger
        await userRef.set({
          email: user.email,
          displayName: displayName || user.email.split("@")[0], // Brug første del af email som standard
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } else if (displayName) {
        // Opdater eksisterende bruger
        await userRef.update({
          displayName: displayName,
        });
      }
    } catch (error) {
      console.error("Error creating/updating user", error);
    }
  },

  async getUserDisplayName(userId) {
    try {
      const doc = await window.db.collection("users").doc(userId).get();
      if (doc.exists) {
        return doc.data().displayName;
      }
      return null;
    } catch (error) {
      console.error("Error getting user display name", error);
      return null;
    }
  },

  async updateUserDisplayName(userId, newDisplayName) {
    try {
      await window.db.collection("users").doc(userId).update({
        displayName: newDisplayName,
      });
      return true;
    } catch (error) {
      console.error("Error updating user display name", error);
      return false;
    }
  },
};
