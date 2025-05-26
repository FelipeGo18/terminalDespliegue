import React, { useState, useEffect, useRef } from "react";

const ADS = [
  {
    src: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExem5wbTZlbzAwYTRoOWMwOWJ6NXo2ODNzZTk2NGVqdmd3Z3JxcWdrNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/409LnuS7fvjzCyuNfj/giphy.gif",
    linkUrl: "https://www.mercadolibre.com/",
    title: "Mercado Libre"
  },
  {
    src: "https://media.giphy.com/media/7yy5D6yYmTvLwWHzIC/giphy.gif",
    linkUrl: "https://www.temu.com/co",
    title: "Temu"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2ZrcWU2cjBuZGpjd3d3OWhid3A1dGplcjJvYnl2em5zanRxbGw0dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7btR4w5GK8CTpNOU/giphy.gif",
    linkUrl: "https://www.amazon.com/",
    title: "Amazon"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmtzOGE0ZjVkdGFvMnJuMnp3aDF1MWdjNWJxeHN5d2VwZXQ5OWhxMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9M4Tka4efd94s/giphy.gif",
    linkUrl: "https://www.nike.com/",
    title: "Nike"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtwNXE2eHZ0YzFlbnFmNjYweXJlazk4NXRpcXJoZ280aWx3N3NhbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ky8QnJeK2PI2HATkTq/giphy.gif",
    linkUrl: "https://www.coca-cola.com/",
    title: "Coca-Cola"
  },
  {
    src: "https://media.giphy.com/media/i9El7z7Obeov4ISCqH/giphy.gif?cid=ecf05e47aie2wmeinzy8r6aptd3ew6u2vrdb1mrz0r0a9zw8&ep=v1_stickers_search&rid=giphy.gif",
    linkUrl: "https://www.netflix.com/",
    title: "Netflix"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjRyNTByMjc1bHpiYmNzM2dkNWludGZ2czRsdXNxcGdndTI2eXo1dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jGFOU6WSXrSzm/giphy.gif",
    linkUrl: "https://www.adidas.com/",
    title: "Adidas"
  },
  {
    src: "https://media.giphy.com/media/gw3NF8hErryY1X1u/giphy.gif?cid=ecf05e47e9uhb7wha58ivgn27sibpfto3spf68h906x3hrau&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    linkUrl: "https://www.starbucks.com/",
    title: "Starbucks"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXNwdXlubnhqN2R4a2xna3M3dGpmcTg1dzhrdzV0Y2g3dXM2c3NuMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bfrlODgSLqXxS/giphy.gif",
    linkUrl: "https://www.apple.com/",
    title: "Apple"
  },
  {
    src: "https://media.giphy.com/media/9Ki0f1FeAQVodjrMGX/giphy.gif?cid=ecf05e47rst5rtaos4tz51uu7a7j76kr7yd6j95h3qhq374u&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    linkUrl: "https://www.samsung.com/",
    title: "Samsung"
  },
  {
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3VzaDM3NTQ2MGNlN2JjN2lzdzdndXFvNnBuMzNyaWx6aDBlaXplcyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/2epS8zhisYtHDCKrWv/giphy.gif",
    linkUrl: "https://www.google.com/",
    title: "Google"
  }
];

function getRandomAd(excludeIndex = null) {
  let idx;
  do {
    idx = Math.floor(Math.random() * ADS.length);
  } while (excludeIndex !== null && idx === excludeIndex && ADS.length > 1);
  return { ad: ADS[idx], idx };
}

const GiphyAd = ({
  width = 120,
  height = 120,
  showPopup = true,
  popupInterval = 30000 // 2 minutos por defecto
}) => {
  const [popupAd, setPopupAd] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [mainAd, setMainAd] = useState(null);
  const intervalRef = useRef();

  useEffect(() => {
    const { ad: popup, idx } = getRandomAd();
    setPopupAd(popup);
    setPopupVisible(showPopup);
    const { ad: main } = getRandomAd(idx);
    setMainAd(main);

    if (showPopup) {
      intervalRef.current = setInterval(() => {
        const { ad: newPopup, idx: newIdx } = getRandomAd();
        setPopupAd(newPopup);
        setPopupVisible(true);
        const { ad: newMain } = getRandomAd(newIdx);
        setMainAd(newMain);
      }, popupInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showPopup, popupInterval]);

  return (
    <>
      {/* Popup */}
      {showPopup && popupVisible && popupAd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setPopupVisible(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              textAlign: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <a
              href={popupAd.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={popupAd.src}
                alt={popupAd.title}
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            </a>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setPopupVisible(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Anuncio normal */}
      {mainAd && (
        <div style={{ width: "100%", textAlign: "center", marginTop: 18 }}>
          <a
            href={mainAd.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block" }}
          >
            <img
              src={mainAd.src}
              width={width}
              height={height}
              style={{ border: "none", borderRadius: 8, background: "#fff" }}
              alt={mainAd.title}
            />
          </a>
        </div>
      )}
    </>
  );
};

export default GiphyAd;