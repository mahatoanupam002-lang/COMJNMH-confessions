// ============================================================================
// MedReform Firebase Configuration & Backend Layer
// ============================================================================
// This file handles all Firebase initialization and real-time database operations
// Setup: Replace YOUR_* placeholders with your Firebase credentials

// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================================
// AUTHENTICATION LAYER
// ============================================================================

class MedReformAuth {
  // Create account with email & password
  static async register(email, password, name, role = 'MBBS Student (Clinical)') {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      const userId = result.user.uid;

      // Create user profile in Firestore
      await db.collection('users').doc(userId).set({
        email: email,
        name: name,
        role: role,
        isAdmin: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        submittedIdeas: [],
        votedIdeas: []
      });

      return { success: true, userId: userId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Login with email & password
  static async login(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, userId: result.user.uid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  static async logout() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is admin
  static async isUserAdmin(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists ? doc.data().isAdmin : false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================================================
// IDEAS LAYER - CRUD Operations
// ============================================================================

class MedReformIdeas {
  // Submit new idea
  static async submitIdea(ideaData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const docRef = await db.collection('ideas').add({
        title: ideaData.title,
        text: ideaData.text,
        category: ideaData.category,
        author: ideaData.author || 'Anonymous',
        userId: user.uid,
        role: ideaData.role,
        feasibility: ideaData.feasibility,
        status: 'submitted',
        votes: 0,
        voterIds: [],
        comments: [],
        flagCount: 0,
        flagged: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Add to user's submitted ideas
      await db.collection('users').doc(user.uid).update({
        submittedIdeas: firebase.firestore.FieldValue.arrayUnion(docRef.id)
      });

      return { success: true, ideaId: docRef.id };
    } catch (error) {
      console.error('Error submitting idea:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all ideas (with optional filters)
  static async getIdeas(filters = {}) {
    try {
      let query = db.collection('ideas');

      if (filters.category && filters.category !== 'all') {
        query = query.where('category', '==', filters.category);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.where('status', '==', filters.status);
      }

      if (filters.notFlagged) {
        query = query.where('flagged', '==', false);
      }

      const snapshot = await query.get();
      const ideas = [];

      snapshot.forEach(doc => {
        ideas.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        });
      });

      // Sort by creation time (newest first)
      ideas.sort((a, b) => b.createdAt - a.createdAt);

      return { success: true, ideas: ideas };
    } catch (error) {
      console.error('Error getting ideas:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single idea by ID
  static async getIdea(ideaId) {
    try {
      const doc = await db.collection('ideas').doc(ideaId).get();
      if (doc.exists) {
        return {
          success: true,
          idea: {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          }
        };
      }
      return { success: false, error: 'Idea not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update idea (admin only)
  static async updateIdea(ideaId, updates) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

      await db.collection('ideas').doc(ideaId).update(updates);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete idea (admin only)
  static async deleteIdea(ideaId) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      await db.collection('ideas').doc(ideaId).delete();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Listen to real-time changes
  static listenToIdeas(callback, filters = {}) {
    try {
      let query = db.collection('ideas');

      if (filters.category && filters.category !== 'all') {
        query = query.where('category', '==', filters.category);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.where('status', '==', filters.status);
      }

      return query.onSnapshot(snapshot => {
        const ideas = [];
        snapshot.forEach(doc => {
          ideas.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          });
        });

        // Sort by creation time
        ideas.sort((a, b) => b.createdAt - a.createdAt);

        callback(ideas);
      });
    } catch (error) {
      console.error('Error listening to ideas:', error);
    }
  }
}

// ============================================================================
// VOTING LAYER
// ============================================================================

class MedReformVoting {
  // Vote on idea
  static async voteIdea(ideaId, vote = true) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const ideaRef = db.collection('ideas').doc(ideaId);
      const ideaDoc = await ideaRef.get();

      if (!ideaDoc.exists) return { success: false, error: 'Idea not found' };

      const voterIds = ideaDoc.data().voterIds || [];
      const currentVotes = ideaDoc.data().votes || 0;
      const hasVoted = voterIds.includes(user.uid);

      if (vote && !hasVoted) {
        // Add vote
        await ideaRef.update({
          votes: currentVotes + 1,
          voterIds: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });

        // Track in user profile
        await db.collection('users').doc(user.uid).update({
          votedIdeas: firebase.firestore.FieldValue.arrayUnion(ideaId)
        });

        return { success: true, voteCount: currentVotes + 1 };
      } else if (!vote && hasVoted) {
        // Remove vote
        await ideaRef.update({
          votes: currentVotes - 1,
          voterIds: firebase.firestore.FieldValue.arrayRemove(user.uid)
        });

        // Remove from user profile
        await db.collection('users').doc(user.uid).update({
          votedIdeas: firebase.firestore.FieldValue.arrayRemove(ideaId)
        });

        return { success: true, voteCount: currentVotes - 1 };
      }

      return { success: false, error: 'Invalid vote operation' };
    } catch (error) {
      console.error('Error voting:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user has voted
  static async hasUserVoted(ideaId) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const doc = await db.collection('ideas').doc(ideaId).get();
      if (doc.exists) {
        return (doc.data().voterIds || []).includes(user.uid);
      }
      return false;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  // Get user's voted ideas
  static async getUserVotedIdeas() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const doc = await db.collection('users').doc(user.uid).get();
      return doc.exists ? (doc.data().votedIdeas || []) : [];
    } catch (error) {
      console.error('Error getting voted ideas:', error);
      return [];
    }
  }
}

// ============================================================================
// COMMENTS LAYER
// ============================================================================

class MedReformComments {
  // Add comment to idea
  static async addComment(ideaId, text) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userName = userDoc.exists ? userDoc.data().name : 'Anonymous';

      const comment = {
        id: Date.now().toString(),
        text: text,
        author: userName,
        userId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('ideas').doc(ideaId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(comment)
      });

      return { success: true, comment: comment };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get comments for idea
  static async getComments(ideaId) {
    try {
      const doc = await db.collection('ideas').doc(ideaId).get();
      if (doc.exists) {
        const comments = doc.data().comments || [];
        return {
          success: true,
          comments: comments.map(c => ({
            ...c,
            createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : new Date()
          }))
        };
      }
      return { success: false, error: 'Idea not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete comment (admin or author)
  static async deleteComment(ideaId, commentId) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const ideaDoc = await db.collection('ideas').doc(ideaId).get();
      if (!ideaDoc.exists) return { success: false, error: 'Idea not found' };

      const comments = ideaDoc.data().comments || [];
      const comment = comments.find(c => c.id === commentId);

      if (!comment) return { success: false, error: 'Comment not found' };

      // Check if user is author or admin
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (comment.userId !== user.uid && !isAdmin) {
        return { success: false, error: 'Cannot delete this comment' };
      }

      const updatedComments = comments.filter(c => c.id !== commentId);

      await db.collection('ideas').doc(ideaId).update({
        comments: updatedComments
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================================================
// FLAGGING LAYER
// ============================================================================

class MedReformFlagging {
  // Flag idea for spam/abuse
  static async flagIdea(ideaId, reason) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const flagRef = db.collection('ideas').doc(ideaId);
      const ideaDoc = await flagRef.get();

      if (!ideaDoc.exists) return { success: false, error: 'Idea not found' };

      const newFlagCount = (ideaDoc.data().flagCount || 0) + 1;
      const shouldHide = newFlagCount >= 3;

      await flagRef.update({
        flagCount: newFlagCount,
        flagged: shouldHide
      });

      // Log the flag
      await db.collection('flags').add({
        ideaId: ideaId,
        reason: reason,
        reportedBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, flagCount: newFlagCount, hidden: shouldHide };
    } catch (error) {
      console.error('Error flagging idea:', error);
      return { success: false, error: error.message };
    }
  }

  // Get flags for admin review
  static async getFlags() {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      const snapshot = await db.collection('flags').orderBy('createdAt', 'desc').get();
      const flags = [];

      snapshot.forEach(doc => {
        flags.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });

      return { success: true, flags: flags };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clear flags for idea (admin)
  static async clearFlags(ideaId) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      await db.collection('ideas').doc(ideaId).update({
        flagCount: 0,
        flagged: false
      });

      // Delete associated flags
      const snapshot = await db.collection('flags').where('ideaId', '==', ideaId).get();
      const batch = db.batch();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================================================
// ADMIN LAYER
// ============================================================================

class MedReformAdmin {
  // Get admin dashboard stats
  static async getStats() {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      const ideasSnapshot = await db.collection('ideas').get();
      const ideas = [];

      ideasSnapshot.forEach(doc => {
        ideas.push(doc.data());
      });

      const stats = {
        totalIdeas: ideas.length,
        submitted: ideas.filter(i => i.status === 'submitted').length,
        reviewed: ideas.filter(i => i.status === 'reviewed').length,
        implemented: ideas.filter(i => i.status === 'implemented').length,
        rejected: ideas.filter(i => i.status === 'rejected').length,
        flagged: ideas.filter(i => i.flagged).length,
        totalVotes: ideas.reduce((sum, i) => sum + (i.votes || 0), 0)
      };

      return { success: true, stats: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Export all data
  static async exportData() {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      const ideasSnapshot = await db.collection('ideas').get();
      const usersSnapshot = await db.collection('users').get();
      const flagsSnapshot = await db.collection('flags').get();

      const ideas = [];
      const users = [];
      const flags = [];

      ideasSnapshot.forEach(doc => {
        ideas.push({ id: doc.id, ...doc.data() });
      });

      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      flagsSnapshot.forEach(doc => {
        flags.push({ id: doc.id, ...doc.data() });
      });

      const data = {
        exportedAt: new Date().toISOString(),
        stats: {
          totalIdeas: ideas.length,
          totalUsers: users.length,
          totalVotes: ideas.reduce((sum, i) => sum + (i.votes || 0), 0)
        },
        ideas: ideas,
        users: users,
        flags: flags
      };

      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Set user as admin
  static async makeAdmin(userId) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const isAdmin = await MedReformAuth.isUserAdmin(user.uid);
      if (!isAdmin) return { success: false, error: 'Admin access required' };

      await db.collection('users').doc(userId).update({
        isAdmin: true
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(timestamp) {
  if (!timestamp) return 'unknown';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, icon = '✓') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const toastIcon = toast.querySelector('.toast-icon');
  const toastText = toast.querySelector('.toast-text');

  if (toastIcon) toastIcon.textContent = icon;
  if (toastText) toastText.textContent = message;

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
