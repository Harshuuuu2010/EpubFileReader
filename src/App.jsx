import React, { useState, useRef, useEffect } from 'react';
import ePub from 'epubjs';

const App = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const readerContainerRef = useRef(null); // Ref for the container to render EPUB content
  const bookRef = useRef(null); // Ref to store the EPUB book instance
  const renditionRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('File selected: ' + selectedFile.name);
      console.log('File selected:', selectedFile.name);
    }
  };

  // Check file integrity and render the document
  const checkFileIntegrity = (file) => {
    const fileType = file.type;
    const isEPUB = fileType === 'application/epub+zip';

    if (!isEPUB) {
      console.log('Invalid file format. Please upload an EPUB file.');
      setUploadStatus('Invalid file format. Please upload an EPUB file.');
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      try {
        const book = ePub(arrayBuffer);
        bookRef.current = book; // Store the book instance
        book.ready
          .then(() => {
            console.log('File is a valid EPUB file');
            setUploadStatus(
              'File uploaded successfully and is a valid EPUB file.'
            );

            // Create rendition with two-page spread
            const rendition = book.renderTo(readerContainerRef.current, {
              width: '100%',
              height: '100%',
              spread: 'always',
              flow: 'paginated',
              minSpreadWidth: 800,
              manager: 'default',
            });
            renditionRef.current = rendition;

            // Register a font for Gujarati or other languages
            rendition.themes.register('custom', {
              body: {
                'max-width': '100%',
                margin: '0 auto !important',
                'overflow-x': 'hidden',
                'font-family': '"Noto Sans", sans-serif', // Ensure proper font for all languages
                'font-size': '1rem', // Adjust font size for readability
                direction: 'ltr', // Set direction, can be changed to 'rtl' for RTL scripts
              },
            });

            // Load Google Fonts dynamically
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);

            rendition.themes.select('custom');

            // Display the first page
            rendition.display();

            // Add keyboard navigation
            document.addEventListener('keyup', (e) => {
              if (e.key === 'ArrowLeft') rendition.prev();
              if (e.key === 'ArrowRight') rendition.next();
            });

            console.log('EPUB content rendered successfully');
          })
          .catch((error) => {
            console.error('Error loading EPUB file:', error);
            setUploadStatus('Error loading EPUB file. It may be corrupted.');
          });
      } catch (error) {
        console.error('Error reading EPUB file:', error);
        setUploadStatus('Error reading EPUB file. It may be corrupted.');
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      setUploadStatus('Error reading file. It may be corrupted.');
    };

    reader.readAsArrayBuffer(file); // Attempt to read file as ArrayBuffer
    return true;
  };

  // Handle file upload
  const handleFileUpload = () => {
    if (file) {
      const isValid = checkFileIntegrity(file);
      if (isValid) {
        console.log('File uploaded successfully:', file.name);
        setUploadStatus('File uploaded successfully');
      }
    } else {
      console.log('No file selected!');
      setUploadStatus('No file selected!');
    }
  };

  useEffect(() => {
    // Cleanup: destroy the book instance when the component is unmounted
    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, []);

  const handlePrevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const handleNextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <input
        type="file"
        accept=".epub"
        onChange={handleFileChange}
      />
      {file && (
        <div>
          <p>File selected: {file.name}</p>
          <button onClick={handleFileUpload}>Upload File</button>
        </div>
      )}
      <p>{uploadStatus}</p>

      {/* Container where the EPUB content will be rendered */}
      <div
        ref={readerContainerRef}
        style={{
          height: '100vh',
          width: '100%',
          border: '1px solid #ccc',
          marginTop: '20px',
          backgroundColor: '#f9f9f9',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      />

      {/* Add navigation controls */}
      {bookRef.current && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={handlePrevPage}>Previous Page</button>
          <button
            onClick={handleNextPage}
            style={{ marginLeft: '10px' }}
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
