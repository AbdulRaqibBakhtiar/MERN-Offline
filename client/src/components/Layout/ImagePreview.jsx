import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export const ImagePreview = ({ src, alt = "Media" }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);


  const preventScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };


  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        onWheel={preventScroll}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          cursor: "zoom-in"
        }}
      />


      {open && (
        <div
          onClick={() => setOpen(false)}
          onWheel={preventScroll}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >

          <button
            onClick={() => setOpen(false)}
            style={{
              position:"absolute",
              top:"20px",
              right:"20px",
              background:"rgba(255,255,255,0.15)",
              border:"none",
              color:"#fff",
              borderRadius:"50%",
              width:"40px",
              height:"40px",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}
          >
            <X size={22}/>
          </button>


          <img
            src={src}
            alt={alt}
            onClick={(e)=>e.stopPropagation()}
            style={{
              maxWidth:"95vw",
              maxHeight:"95vh",
              objectFit:"contain",
              borderRadius:"12px"
            }}
          />

        </div>
      )}
    </>
  );
};