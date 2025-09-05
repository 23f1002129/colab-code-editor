import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import { IndexeddbPersistence } from 'y-indexeddb';
import { SocketIOProvider } from 'y-socket.io';

function App() {
  const [yjsState, setYjsState] = useState(null);
  const [editorExtensions, setEditorExtensions] = useState([]);

  // This useEffect runs only ONCE to initialize Yjs.
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new SocketIOProvider('http://192.168.10.38:3001', 'my-document-id', ydoc, {});
    const persistence = new IndexeddbPersistence('my-document-id', ydoc);
    const ytext = ydoc.getText('monaco'); // The name 'monaco' is just an identifier, it can be anything
    
    setYjsState({ provider, ydoc, ytext, awareness: provider.awareness });
    
    return () => {
      ydoc.destroy();
      provider.disconnect();
    };
  }, []);

  // This useEffect runs when yjsState is ready to create the CodeMirror extensions
  useEffect(() => {
    if (yjsState) {
      const { ytext, awareness } = yjsState;

      // Set user info for cursors and selections
      const colors = ['#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352', '#9ac2c9'];
      const userColor = colors[Math.floor(Math.random() * colors.length)];
      const userName = `User ${Math.floor(Math.random() * 100)}`;
      
      awareness.setLocalStateField('user', { 
        name: userName, 
        color: userColor,
        colorLight: userColor + '33' // 33 is hex for 20% opacity, used for selection background
      });

      // The yCollab extension provides all the real-time features
      const extensions = [
        yCollab(ytext, awareness, {
          yUndoManager: new Y.UndoManager(ytext)
        })
      ];
      
      setEditorExtensions(extensions);
    }
  }, [yjsState]);

  return (
    <CodeMirror
      height="100vh"
      extensions={editorExtensions}
      theme="dark" 
    />
  );
}

export default App;