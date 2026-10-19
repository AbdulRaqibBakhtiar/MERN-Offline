import { API_BASE_URL } from '../api/config';
import React,{useState,useEffect} from 'react';

export const AdminBroadcastConsole=({
  croppedNewsFile,
  setCroppedNewsFile,
  newsPreviewUrl,
  setNewsPreviewUrl,
  setIsNewsCropOpen,
  loadNewsFeed,
  themeTransition
})=>{
  const [isOpen,setIsOpen]=useState(false);
  const [success,setSuccess]=useState('');
  const [error,setError]=useState('');
  const [videoFile,setVideoFile]=useState(null);
  const [videoPreviewUrl,setVideoPreviewUrl]=useState('');
  const [isPublishing,setIsPublishing]=useState(false);

  useEffect(()=>{
    let t;

    if(success){
      t=setTimeout(()=>{
        setSuccess('');
        setIsOpen(false);
      },2200);
    }

    return()=>clearTimeout(t);
  },[success]);

  useEffect(()=>{
    return()=>{
      if(videoPreviewUrl){
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  },[videoPreviewUrl]);

  const imageFiles=Array.isArray(croppedNewsFile)
    ?croppedNewsFile.filter(Boolean)
    :croppedNewsFile
      ?[croppedNewsFile]
      :[];

  const removeImages=()=>{
    setCroppedNewsFile(null);
    setNewsPreviewUrl(null);
  };

  const handleVideoChange=e=>{
    const file=e.target.files?.[0];

    if(!file){
      setVideoFile(null);
      setVideoPreviewUrl('');
      return;
    }

    if(!file.type.startsWith('video/')){
      e.target.value='';
      setVideoFile(null);
      setVideoPreviewUrl('');
      setError('Please select a valid video file.');
      return;
    }

    if(videoPreviewUrl){
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const preview=URL.createObjectURL(file);

    setVideoFile(file);
    setVideoPreviewUrl(preview);
    setError('');
  };

  const removeVideo=()=>{
    if(videoPreviewUrl){
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setVideoFile(null);
    setVideoPreviewUrl('');

    const input=document.getElementById('news-video-upload');

    if(input){
      input.value='';
    }
  };

  const handleSubmit=async e=>{
    e.preventDefault();

    if(isPublishing) return;

    setError('');
    setSuccess('');

    const form=e.currentTarget;
    const formData=new FormData(form);

    imageFiles.forEach(file=>{
      if(file instanceof File){
        formData.append('images',file,file.name);
      }
    });

    if(videoFile){
      formData.append('video',videoFile,videoFile.name);
    }

    try{
      setIsPublishing(true);

      const response=await fetch(
        `${API_BASE_URL}/content/news`,
        {
          method:'POST',
          headers:{
            Authorization:`Bearer ${localStorage.getItem('token')||''}`
          },
          body:formData
        }
      );

      const contentType=response.headers.get('content-type')||'';

      let data;

      if(contentType.includes('application/json')){
        data=await response.json();
      }else{
        const text=await response.text();
        throw new Error(
          text||`Server returned HTTP ${response.status}.`
        );
      }

      if(!response.ok){
        throw new Error(
          data?.error||
          data?.message||
          `Failed to publish news. HTTP ${response.status}.`
        );
      }

      removeImages();
      removeVideo();
      form.reset();

      await Promise.resolve(loadNewsFeed());

      setSuccess('🚀 News published successfully!');
    }catch(err){
      console.error('News publish error:',err);
      setError(err.message||'Failed to publish news.');
    }finally{
      setIsPublishing(false);
    }
  };

  return(
    <article
      className="panel-card home-feed-item-card"
      style={{
        background:'var(--bg-card,transparent)',
        border:'1px solid var(--border-color,#e2e8f0)',
        borderRadius:'16px',
        padding:'12px',
        transition:themeTransition,
        width:'100%'
      }}
    >
      <details
        open={isOpen}
        onToggle={e=>setIsOpen(e.target.open)}
        style={{width:'100%'}}
      >
        <summary
          style={{
            fontSize:'0.9rem',
            fontWeight:'700',
            color:'var(--primary-accent,#4f46e5)',
            cursor:'pointer',
            listStyle:'none',
            display:'flex',
            alignItems:'center',
            userSelect:'none'
          }}
        >
          <span>＋ Share a community post</span>

          {isOpen&&(
            <button
              type="button"
              onClick={e=>{
                e.preventDefault();
                e.stopPropagation();
                if(!isPublishing) setIsOpen(false);
              }}
              style={{
                background:'transparent',
                border:'none',
                color:'#ef4444',
                fontSize:'15px',
                fontWeight:'bold',
                cursor:isPublishing?'not-allowed':'pointer',
                marginLeft:'auto',
                padding:'0 8px'
              }}
            >
              ✕
            </button>
          )}
        </summary>

        {success&&(
          <div
            style={{
              marginTop:'12px',
              padding:'10px',
              background:'#d1fae5',
              color:'#065f46',
              borderRadius:'8px',
              fontSize:'0.8rem',
              fontWeight:'600'
            }}
          >
            {success}
          </div>
        )}

        {error&&(
          <div
            style={{
              marginTop:'12px',
              padding:'10px',
              background:'#fee2e2',
              color:'#991b1b',
              border:'1px solid #fecaca',
              borderRadius:'8px',
              fontSize:'0.8rem',
              fontWeight:'600'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop:'14px',
            display:'flex',
            flexDirection:'column',
            gap:'12px'
          }}
        >
          <input
            type="text"
            name="title"
            placeholder="Article Title..."
            required
            disabled={isPublishing}
            style={{
              width:'100%',
              padding:'8px 10px',
              borderRadius:'8px',
              border:'1px solid var(--border-color,#cbd5e1)',
              background:'var(--bg-input,#fff)',
              color:'var(--text-primary,#0f172a)',
              fontSize:'0.8rem',
              outline:'none'
            }}
          />

          <input
            type="text"
            name="summary"
            placeholder="Short summary narrative statement..."
            required
            disabled={isPublishing}
            style={{
              width:'100%',
              padding:'8px 10px',
              borderRadius:'8px',
              border:'1px solid var(--border-color,#cbd5e1)',
              background:'var(--bg-input,#fff)',
              color:'var(--text-primary,#0f172a)',
              fontSize:'0.8rem',
              outline:'none'
            }}
          />

          <input
            type="text"
            name="fullText"
            placeholder="Full expanded body text..."
            required
            disabled={isPublishing}
            style={{
              width:'100%',
              padding:'8px 10px',
              borderRadius:'8px',
              border:'1px solid var(--border-color,#cbd5e1)',
              background:'var(--bg-input,#fff)',
              color:'var(--text-primary,#0f172a)',
              fontSize:'0.8rem',
              outline:'none'
            }}
          />

          <div
            style={{
              display:'flex',
              alignItems:'center',
              gap:'8px',
              flexWrap:'wrap'
            }}
          >
            <button
              type="button"
              disabled={isPublishing}
              onClick={()=>{
                setError('');
                setIsNewsCropOpen(true);
              }}
              style={{
                padding:'8px 12px',
                background:'var(--bg-btn-secondary,#f1f5f9)',
                color:'var(--text-secondary,#475569)',
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'8px',
                cursor:isPublishing?'not-allowed':'pointer',
                fontSize:'0.8rem',
                fontWeight:'600',
                opacity:isPublishing?0.6:1
              }}
            >
              📷 Attach Graphics
            </button>

            <label
              htmlFor="news-video-upload"
              style={{
                padding:'8px 12px',
                background:'var(--bg-btn-secondary,#f1f5f9)',
                color:'var(--text-secondary,#475569)',
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'8px',
                cursor:isPublishing?'not-allowed':'pointer',
                fontSize:'0.8rem',
                fontWeight:'600',
                opacity:isPublishing?0.6:1
              }}
            >
              🎥 Attach Video
            </label>

            <input
              id="news-video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={isPublishing}
              style={{display:'none'}}
            />
          </div>

          {imageFiles.length>0&&(
            <div
              style={{
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'12px',
                padding:'8px',
                background:'var(--bg-main,#f8fafc)'
              }}
            >
              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  marginBottom:'8px'
                }}
              >
                <span
                  style={{
                    fontSize:'0.75rem',
                    fontWeight:'700',
                    color:'var(--text-secondary,#475569)'
                  }}
                >
                  📷 {imageFiles.length===1
                    ?'1 image attached'
                    :`${imageFiles.length} images attached`}
                </span>

                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={removeImages}
                  style={{
                    border:'none',
                    background:'transparent',
                    color:'#ef4444',
                    cursor:isPublishing?'not-allowed':'pointer',
                    fontSize:'0.72rem',
                    fontWeight:'700'
                  }}
                >
                  Remove Images
                </button>
              </div>

              <div
                style={{
                  display:'grid',
                  gridTemplateColumns:
                    imageFiles.length===1
                      ?'1fr'
                      :imageFiles.length===2
                        ?'1fr 1fr'
                        :'repeat(3,1fr)',
                  gap:'6px',
                  maxHeight:'260px',
                  overflow:'hidden',
                  borderRadius:'8px'
                }}
              >
                {imageFiles.map((file,index)=>{
                  const url=
                    newsPreviewUrl?.[index]||
                    (Array.isArray(newsPreviewUrl)
                      ?newsPreviewUrl[index]
                      :index===0&&typeof newsPreviewUrl==='string'
                        ?newsPreviewUrl
                        :'');

                  if(!url) return null;

                  return(
                    <img
                      key={`${file.name||'image'}-${index}`}
                      src={url}
                      alt={`Attached graphic ${index+1}`}
                      style={{
                        width:'100%',
                        height:imageFiles.length===1?'220px':'110px',
                        objectFit:'cover',
                        display:'block',
                        borderRadius:'6px',
                        background:'#e2e8f0'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!imageFiles.length&&!videoFile&&(
            <div
              style={{
                minHeight:'110px',
                border:'2px dashed var(--border-color,#cbd5e1)',
                borderRadius:'12px',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                justifyContent:'center',
                gap:'5px',
                color:'var(--text-muted,#64748b)',
                background:'var(--bg-main,#f8fafc)',
                textAlign:'center'
              }}
            >
              <span style={{fontSize:'1.4rem'}}>🖼️</span>

              <strong style={{fontSize:'0.8rem'}}>
                No graphics attached
              </strong>

              <span style={{fontSize:'0.7rem'}}>
                Attach one image or select multiple images for a collage
              </span>
            </div>
          )}

          {videoFile&&(
            <div
              style={{
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'12px',
                padding:'8px',
                background:'var(--bg-main,#f8fafc)'
              }}
            >
              <div
                style={{
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  marginBottom:'8px'
                }}
              >
                <span
                  style={{
                    fontSize:'0.75rem',
                    fontWeight:'700'
                  }}
                >
                  🎥 Video attached
                </span>

                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={removeVideo}
                  style={{
                    border:'none',
                    background:'transparent',
                    color:'#ef4444',
                    cursor:isPublishing?'not-allowed':'pointer',
                    fontSize:'0.72rem',
                    fontWeight:'700'
                  }}
                >
                  Remove Video
                </button>
              </div>

              <video
                src={videoPreviewUrl}
                controls
                playsInline
                preload="metadata"
                style={{
                  display:'block',
                  width:'100%',
                  maxHeight:'300px',
                  background:'#000',
                  borderRadius:'8px'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPublishing}
            style={{
              padding:'10px',
              background:isPublishing
                ?'#94a3b8'
                :'var(--primary-button,#3b82f6)',
              color:'#fff',
              border:'none',
              borderRadius:'8px',
              fontSize:'0.85rem',
              fontWeight:'700',
              cursor:isPublishing?'not-allowed':'pointer',
              opacity:isPublishing?0.85:1
            }}
          >
            {isPublishing
              ?'⏳ Publishing...'
              :'🚀 Publish Stream To Dashboard'}
          </button>
        </form>
      </details>
    </article>
  );
};
