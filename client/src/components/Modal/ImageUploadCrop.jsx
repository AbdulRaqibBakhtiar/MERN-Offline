import React,{useState,useCallback,useEffect,useId} from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-easy-crop';

const ASPECT_RATIOS=[
  {label:'1:1 Square',value:1},
  {label:'4:3 Classic',value:4/3},
  {label:'16:9 Video',value:16/9},
  {label:'Free Crop',value:undefined}
];

function ImageUploadCrop({
  isOpen,
  onClose,
  onCropComplete,
  onCropCompleteSuccess,
  title='Upload & Crop Image'
}){
  const inputId=useId().replace(/:/g,'-');

  const [imageSrc,setImageSrc]=useState(null);
  const [selectedFiles,setSelectedFiles]=useState([]);
  const [currentIndex,setCurrentIndex]=useState(0);
  const [croppedFiles,setCroppedFiles]=useState([]);
  const [crop,setCrop]=useState({x:0,y:0});
  const [zoom,setZoom]=useState(1);
  const [aspect,setAspect]=useState(1);
  const [croppedAreaPixels,setCroppedAreaPixels]=useState(null);
  const [hoveredRatio,setHoveredRatio]=useState(null);
  const [manualWidth,setManualWidth]=useState(220);
  const [manualHeight,setManualHeight]=useState(150);

  const onCropChangeComplete=useCallback((_,pixels)=>{
    if(pixels){
      setCroppedAreaPixels(pixels);
    }
  },[]);

  const loadImageFile=file=>{
    if(!file)return;

    const reader=new FileReader();

    reader.onload=()=>{
      setImageSrc(reader.result);
      setCrop({x:0,y:0});
      setZoom(1);
      setCroppedAreaPixels(null);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange=e=>{
    const files=Array.from(e.target.files||[]).filter(file=>
      file.type.startsWith('image/')
    );

    e.target.value='';

    if(!files.length)return;

    setSelectedFiles(files);
    setCroppedFiles([]);
    setCurrentIndex(0);
    loadImageFile(files[0]);
  };

  const handleSelectImage=index=>{
    if(index===currentIndex)return;

    setCurrentIndex(index);
    loadImageFile(selectedFiles[index]);
  };

  const generateCroppedBlob=(src,pixelCrop,fileIndex)=>{
    return new Promise((resolve,reject)=>{
      const image=new Image();

      image.onload=()=>{
        try{
          const safeCrop=pixelCrop||{
            x:0,
            y:0,
            width:image.naturalWidth,
            height:image.naturalHeight
          };

          const canvas=document.createElement('canvas');
          const ctx=canvas.getContext('2d');

          if(!ctx){
            reject(new Error('Canvas context unavailable.'));
            return;
          }

          canvas.width=Math.max(1,Math.round(safeCrop.width));
          canvas.height=Math.max(1,Math.round(safeCrop.height));

          ctx.drawImage(
            image,
            safeCrop.x,
            safeCrop.y,
            safeCrop.width,
            safeCrop.height,
            0,
            0,
            canvas.width,
            canvas.height
          );

          canvas.toBlob(blob=>{
            if(!blob){
              reject(new Error('Unable to create cropped image.'));
              return;
            }

            const originalName=selectedFiles[fileIndex]?.name||`image-${fileIndex+1}`;
            const baseName=originalName.replace(/\.[^/.]+$/,'');

            resolve(
              new File(
                [blob],
                `${baseName}-cropped-${Date.now()}.jpg`,
                {type:'image/jpeg'}
              )
            );
          },'image/jpeg',0.9);
        }catch(err){
          reject(err);
        }
      };

      image.onerror=()=>{
        reject(new Error('Unable to load image.'));
      };

      image.src=src;
    });
  };

  const handleSubmit=async e=>{
    e.preventDefault();

    if(!imageSrc||!selectedFiles.length)return;

    try{
      const file=await generateCroppedBlob(
        imageSrc,
        croppedAreaPixels,
        currentIndex
      );

      const updated=[...croppedFiles];
      updated[currentIndex]=file;

      setCroppedFiles(updated);

      if(currentIndex<selectedFiles.length-1){
        const nextIndex=currentIndex+1;

        setCurrentIndex(nextIndex);
        setCrop({x:0,y:0});
        setZoom(1);
        setCroppedAreaPixels(null);

        loadImageFile(selectedFiles[nextIndex]);

        return;
      }

      const finalFiles=selectedFiles.map((_,index)=>updated[index]);

      if(finalFiles.some(file=>!file)){
        console.error('Some selected images were not cropped.');
        return;
      }

      const result=finalFiles.length===1
        ? finalFiles[0]
        : finalFiles;

      if(typeof onCropComplete==='function'){
        onCropComplete(result);
      }else if(typeof onCropCompleteSuccess==='function'){
        onCropCompleteSuccess(result);
      }

      handleCloseClean();
    }catch(err){
      console.error('Image crop failed:',err);
    }
  };

  const handleCloseClean=()=>{
    setImageSrc(null);
    setSelectedFiles([]);
    setCroppedFiles([]);
    setCurrentIndex(0);
    setCroppedAreaPixels(null);
    setZoom(1);
    setAspect(1);
    setCrop({x:0,y:0});
    setManualWidth(220);
    setManualHeight(150);

    if(typeof onClose==='function'){
      onClose();
    }
  };

  useEffect(()=>{
    if(!isOpen){
      setImageSrc(null);
      setSelectedFiles([]);
      setCroppedFiles([]);
      setCurrentIndex(0);
      setCroppedAreaPixels(null);
    }
  },[isOpen]);

  if(!isOpen)return null;

  const multipleImages=selectedFiles.length>1;
  const completedCount=croppedFiles.filter(Boolean).length;
  const isLastImage=currentIndex===selectedFiles.length-1;

  const cropperProps={
    image:imageSrc,
    crop,
    zoom,
    onCropChange:setCrop,
    onCropComplete:onCropChangeComplete,
    onZoomChange:setZoom,
    showGrid:true
  };

  if(aspect!==undefined){
    cropperProps.aspect=aspect;
  }else{
    cropperProps.cropSize={
      width:manualWidth,
      height:manualHeight
    };
  }

  return ReactDOM.createPortal(
    <div
      style={{
        position:'fixed',
        inset:0,
        backgroundColor:'rgba(15,23,42,.6)',
        backdropFilter:'blur(4px)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        zIndex:99999
      }}
    >
      <div
        style={{
          width:'440px',
          maxWidth:'calc(100vw - 24px)',
          maxHeight:'94vh',
          overflowY:'auto',
          background:'var(--bg-card,#fff)',
          padding:'24px',
          borderRadius:'12px',
          boxShadow:'0 20px 25px -5px rgba(0,0,0,.2)',
          boxSizing:'border-box',
          border:'1px solid var(--border-color,transparent)'
        }}
      >
        <div
          style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            marginBottom:'16px'
          }}
        >
          <h3
            style={{
              margin:0,
              fontSize:'1.25rem',
              fontWeight:'bold',
              color:'var(--text-primary,inherit)'
            }}
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={handleCloseClean}
            style={{
              background:'none',
              border:'none',
              fontSize:'1.25rem',
              cursor:'pointer',
              color:'var(--text-muted,#64748b)'
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display:'flex',
            flexDirection:'column',
            gap:'16px'
          }}
        >
          {imageSrc?(
            <>
              {multipleImages&&(
                <>
                  <div
                    style={{
                      display:'flex',
                      justifyContent:'space-between',
                      fontSize:'0.75rem',
                      fontWeight:'700',
                      color:'var(--text-secondary,#475569)'
                    }}
                  >
                    <span>
                      Image {currentIndex+1} of {selectedFiles.length}
                    </span>

                    <span style={{color:'#10b981'}}>
                      {completedCount}/{selectedFiles.length} cropped
                    </span>
                  </div>

                  <div
                    style={{
                      display:'flex',
                      gap:'7px',
                      overflowX:'auto',
                      padding:'2px 2px 6px'
                    }}
                  >
                    {selectedFiles.map((file,index)=>(
                      <button
                        key={`${file.name}-${index}`}
                        type="button"
                        onClick={()=>handleSelectImage(index)}
                        style={{
                          position:'relative',
                          flex:'0 0 52px',
                          width:'52px',
                          height:'52px',
                          padding:0,
                          borderRadius:'7px',
                          overflow:'hidden',
                          cursor:'pointer',
                          border:currentIndex===index
                            ?'2px solid #3b82f6'
                            :'1px solid var(--border-color,#cbd5e1)',
                          background:'var(--bg-main,#f8fafc)'
                        }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          style={{
                            width:'100%',
                            height:'100%',
                            objectFit:'cover',
                            display:'block'
                          }}
                        />

                        {croppedFiles[index]&&(
                          <span
                            style={{
                              position:'absolute',
                              right:2,
                              bottom:2,
                              width:16,
                              height:16,
                              borderRadius:'50%',
                              background:'#10b981',
                              color:'#fff',
                              fontSize:10,
                              fontWeight:'bold',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'center'
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div
                style={{
                  display:'flex',
                  gap:'6px',
                  overflowX:'auto',
                  paddingBottom:'4px'
                }}
              >
                {ASPECT_RATIOS.map(ratio=>(
                  <button
                    key={ratio.label}
                    type="button"
                    onMouseEnter={()=>setHoveredRatio(ratio.label)}
                    onMouseLeave={()=>setHoveredRatio(null)}
                    onClick={()=>setAspect(ratio.value)}
                    style={{
                      flex:1,
                      padding:'8px 6px',
                      fontSize:'0.75rem',
                      fontWeight:'600',
                      cursor:'pointer',
                      borderRadius:'6px',
                      whiteSpace:'nowrap',
                      border:aspect===ratio.value
                        ?'1px solid #3b82f6'
                        :'1px solid var(--border-color,#cbd5e1)',
                      background:aspect===ratio.value
                        ?'#3b82f6'
                        :hoveredRatio===ratio.label
                          ?'var(--border-color,#e2e8f0)'
                          :'var(--bg-main,#f8fafc)',
                      color:aspect===ratio.value
                        ?'#fff'
                        :'var(--text-primary,#0f172a)'
                    }}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              <div
                style={{
                  position:'relative',
                  height:'260px',
                  background:'#0f172a',
                  borderRadius:'8px',
                  overflow:'hidden'
                }}
              >
                <Cropper {...cropperProps}/>
              </div>

              <div
                style={{
                  display:'flex',
                  flexDirection:'column',
                  gap:'8px',
                  background:'var(--bg-main,#f8fafc)',
                  padding:'12px',
                  borderRadius:'8px',
                  border:'1px solid var(--border-color,#e2e8f0)'
                }}
              >
                <div
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'10px'
                  }}
                >
                  <span
                    style={{
                      fontSize:'0.8rem',
                      fontWeight:'600',
                      minWidth:'80px'
                    }}
                  >
                    🔍 Zoom:
                  </span>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={e=>setZoom(Number(e.target.value))}
                    style={{flex:1}}
                  />
                </div>

                {aspect===undefined&&(
                  <>
                    <div
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'10px'
                      }}
                    >
                      <span style={{minWidth:'80px',fontSize:'0.8rem'}}>
                        ↔️ Width:
                      </span>

                      <input
                        type="range"
                        min="50"
                        max="380"
                        value={manualWidth}
                        onChange={e=>setManualWidth(Number(e.target.value))}
                        style={{flex:1}}
                      />

                      <span>{manualWidth}px</span>
                    </div>

                    <div
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'10px'
                      }}
                    >
                      <span style={{minWidth:'80px',fontSize:'0.8rem'}}>
                        ↕️ Height:
                      </span>

                      <input
                        type="range"
                        min="50"
                        max="240"
                        value={manualHeight}
                        onChange={e=>setManualHeight(Number(e.target.value))}
                        style={{flex:1}}
                      />

                      <span>{manualHeight}px</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ):(
            <div
              style={{
                background:'var(--bg-main,#f8fafc)',
                border:'2px dashed var(--border-color,#cbd5e1)',
                borderRadius:'8px',
                height:'140px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'var(--text-muted,#64748b)',
                fontSize:'0.85rem'
              }}
            >
              No file loaded into crop workspace
            </div>
          )}

          <div>
            <input
              type="file"
              id={inputId}
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{display:'none'}}
            />

            <label
              htmlFor={inputId}
              style={{
                display:'block',
                textAlign:'center',
                padding:'10px',
                background:'var(--border-color,#f1f5f9)',
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'6px',
                cursor:'pointer',
                fontWeight:'600',
                fontSize:'0.85rem'
              }}
            >
              📷 {selectedFiles.length
                ?'Choose Different Images'
                :'Choose Photo(s)...'}
            </label>

            {selectedFiles.length>0&&(
              <div
                style={{
                  marginTop:'6px',
                  textAlign:'center',
                  fontSize:'0.7rem',
                  color:'var(--text-muted,#64748b)'
                }}
              >
                {selectedFiles.length} image{selectedFiles.length>1?'s':''} selected
              </div>
            )}
          </div>

          <div
            style={{
              display:'flex',
              gap:'10px'
            }}
          >
            <button
              type="submit"
              disabled={!imageSrc}
              style={{
                background:imageSrc?'#10b981':'#cbd5e1',
                color:'#fff',
                border:'none',
                borderRadius:'6px',
                flex:2,
                padding:'12px',
                fontSize:'0.9rem',
                fontWeight:'bold',
                cursor:imageSrc?'pointer':'not-allowed'
              }}
            >
              {multipleImages
                ?isLastImage
                  ?'✓ Finish Image Set'
                  :'✓ Crop & Next Image'
                :'Apply Crop Selection'}
            </button>

            <button
              type="button"
              onClick={handleCloseClean}
              style={{
                background:'var(--bg-card,#fff)',
                color:'var(--text-primary,#0f172a)',
                border:'1px solid var(--border-color,#cbd5e1)',
                borderRadius:'6px',
                flex:1,
                padding:'12px',
                fontSize:'0.9rem',
                fontWeight:'600',
                cursor:'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ImageUploadCrop;