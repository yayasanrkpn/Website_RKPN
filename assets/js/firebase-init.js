   const firebaseConfig = {
      apiKey: "AIzaSyC5FbZniwqyO3_NQpw_bDeOpPYMUASMo4c",
     authDomain: "globalyouthsummit-e600a.firebaseapp.com",
      projectId: "globalyouthsummit-e600a",
     storageBucket: "globalyouthsummit-e600a.appspot.com",
     messagingSenderId: "875073062663",
     appId: "1:875073062663:web:88dcedf0dd4a537ecd67a2"
     };

firebase.initializeApp(firebaseConfig);
 window.db = firebase.firestore();
 window.storage = firebase.storage();