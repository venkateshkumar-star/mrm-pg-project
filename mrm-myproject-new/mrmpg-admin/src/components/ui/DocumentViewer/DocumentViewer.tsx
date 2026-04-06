import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useImage } from '@/utils';
import Icons from '../Icons';

interface DocumentViewerProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  imageUrl,
  onClose,
  title = 'Document'
}) => {
  const { imageUrl: authenticatedUrl, loading, error } = useImage(imageUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="document-viewer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="document-viewer-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '300px',
          minHeight: '200px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Icons name="close" size={18} />
        </button>

        {/* Content */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          padding: '20px',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {loading && (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                minHeight: '200px'
              }}
            >
              {/* Custom Spinner */}
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #007bff',
                  borderRadius: '50%',
                  animation: 'documentViewerSpin 1s linear infinite'
                }}
              />
              <span style={{ color: '#666', fontSize: '14px' }}>
                Loading {title.toLowerCase()}...
              </span>
            </div>
          )}

          {error && (
            <div 
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#e74c3c',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <Icons name="alertTriangle" size={48} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Failed to load {title.toLowerCase()}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {error || 'Please try again or contact support'}
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && authenticatedUrl && (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'auto'
            }}>
              <img
                src={authenticatedUrl}
                alt={title}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 60px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Spinner Animation Styles */}
      <style>{`
        @keyframes documentViewerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DocumentViewer;
