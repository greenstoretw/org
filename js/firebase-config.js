// Firebase 配置資訊 - 已更新為您的專案設定
var firebaseConfig = {
  apiKey: "AIzaSyBYVzIEA4RxUH2IxojDnln0QNKC8gyemfg",
  authDomain: "greenstore-1ce0f.firebaseapp.com",
  databaseURL: "https://greenstore-1ce0f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "greenstore-1ce0f",
  storageBucket: "greenstore-1ce0f.firebasestorage.app",
  messagingSenderId: "332361925906",
  appId: "1:332361925906:web:8b0155a9d924483d681fcb",
  measurementId: "G-1PTCMM7MCM"
};

// 初始化 Firebase (使用 Compat 模式以支援 CDN 引入)
if (typeof firebase !== 'undefined') { firebase.initializeApp(firebaseConfig); } else { console.error('Firebase SDK not loaded.'); }
var db = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;
window.db = db;

// Enable Firestore offline persistence for smooth/fast performance
if (db) {
  db.enablePersistence().catch(function(err) {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence not supported by browser.");
    }
  });
}
var auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
window.auth = auth;
var storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;
window.storage = storage;
var analytics = (typeof firebase.analytics === 'function') ? firebase.analytics() : null;
window.analytics = analytics;

console.log("Firebase 雲端連線已成功初始化！");



