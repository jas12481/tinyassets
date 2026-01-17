import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>TinyAssets - Learn Real-World Assets Safely</title>
        <meta name="description" content="Gamified learning platform for kids to learn about real-world assets with no real money involved" />
      </Head>
      
      <div className="container">
        <header className="header">
          <h1 className="title">TinyAssets</h1>
          <p className="tagline">
            Learn how real-world assets work — safely and playfully.
          </p>
        </header>
        
        <main className="main">
          <div className="hero-section">
            <div className="asset-icons">
              <div className="icon">
                <div className="icon-emoji">🏠</div>
                <div className="icon-label">Property</div>
              </div>
              <div className="icon">
                <div className="icon-emoji">☀️</div>
                <div className="icon-label">Solar</div>
              </div>
              <div className="icon">
                <div className="icon-emoji">💰</div>
                <div className="icon-label">Gold</div>
              </div>
            </div>
          </div>
          
          <div className="button-container">
            <Link href="/asset-choice" className="button-link">
              <button className="button kids-button">
                <span className="button-icon">🎮</span>
                <span className="button-text">Start Learning (Kids)</span>
                <span className="button-arrow">→</span>
              </button>
            </Link>
            
            <Link href="/parent" className="button-link">
              <button className="button parent-button">
                <span className="button-icon">👨‍👩‍👧</span>
                <span className="button-text">Parent View</span>
                <span className="button-arrow">→</span>
              </button>
            </Link>
          </div>
          
          <div className="safety-notice">
            <div className="safety-icons">
              <div className="safety-item">
                <span className="safety-check">✅</span>
                <span>100% Safe Learning</span>
              </div>
              <div className="safety-item">
                <span className="safety-check">✅</span>
                <span>No Real Money</span>
              </div>
              <div className="safety-item">
                <span className="safety-check">✅</span>
                <span>Educational Focus</span>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeIn 0.8s ease-out;
        }
        
        .title {
          font-size: 4rem;
          font-weight: 900;
          color: white;
          margin: 0;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
          letter-spacing: -1px;
          background: linear-gradient(to right, #ffffff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .tagline {
          font-size: 1.5rem;
          color: rgba(255,255,255,0.95);
          max-width: 600px;
          margin: 20px auto 0;
          line-height: 1.6;
          font-weight: 300;
        }
        
        .hero-section {
          margin: 60px 0;
        }
        
        .asset-icons {
          display: flex;
          gap: 40px;
          animation: float 3s ease-in-out infinite;
        }
        
        .icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .icon-emoji {
          font-size: 5rem;
          background: rgba(255,255,255,0.15);
          width: 120px;
          height: 120px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(15px);
          border: 3px solid rgba(255,255,255,0.3);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .icon-emoji:hover {
          transform: translateY(-15px) scale(1.1);
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.5);
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        .icon-label {
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
          opacity: 0.9;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        .button-container {
          display: flex;
          flex-direction: column;
          gap: 25px;
          max-width: 500px;
          width: 100%;
          animation: slideUp 0.6s ease-out 0.3s both;
        }
        
        .button-link {
          text-decoration: none;
          width: 100%;
        }
        
        .button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 35px;
          border-radius: 20px;
          font-size: 1.4rem;
          font-weight: 700;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        
        .button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s;
        }
        
        .button:hover::before {
          left: 100%;
        }
        
        .kids-button {
          background: linear-gradient(to right, #FFD166, #FF9E5E);
          color: #2d1b00;
          box-shadow: 0 10px 30px rgba(255, 179, 71, 0.5);
        }
        
        .kids-button:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255, 179, 71, 0.7);
          background: linear-gradient(to right, #FFE082, #FFB347);
        }
        
        .parent-button {
          background: linear-gradient(to right, #4ECDC4, #2AA198);
          color: white;
          box-shadow: 0 10px 30px rgba(68, 160, 141, 0.5);
        }
        
        .parent-button:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(68, 160, 141, 0.7);
          background: linear-gradient(to right, #5EDFD6, #44A08D);
        }
        
        .button-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        
        .button-text {
          flex: 1;
          text-align: center;
          font-size: 1.5rem;
        }
        
        .button-arrow {
          font-size: 1.8rem;
          opacity: 0.8;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }
        
        .button:hover .button-arrow {
          transform: translateX(10px);
        }
        
        .safety-notice {
          margin-top: 60px;
          padding: 25px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255,255,255,0.2);
          animation: fadeIn 1s ease-out 0.6s both;
          max-width: 600px;
          width: 100%;
        }
        
        .safety-icons {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .safety-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: white;
          font-size: 1.1rem;
          font-weight: 500;
          text-align: center;
        }
        
        .safety-check {
          font-size: 1.8rem;
          background: rgba(255,255,255,0.2);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 5px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 10px 30px rgba(255, 179, 71, 0.5); }
          50% { box-shadow: 0 10px 40px rgba(255, 179, 71, 0.8); }
        }
        
        @media (max-width: 768px) {
          .title {
            font-size: 3rem;
          }
          
          .tagline {
            font-size: 1.3rem;
            padding: 0 20px;
          }
          
          .asset-icons {
            gap: 20px;
            flex-direction: column;
            align-items: center;
          }
          
          .icon-emoji {
            width: 100px;
            height: 100px;
            font-size: 4rem;
          }
          
          .button {
            padding: 20px 25px;
            font-size: 1.2rem;
          }
          
          .button-text {
            font-size: 1.3rem;
          }
          
          .safety-icons {
            flex-direction: column;
            gap: 25px;
          }
          
          .safety-item {
            flex-direction: row;
            justify-content: center;
            gap: 15px;
          }
          
          .safety-check {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
            margin-bottom: 0;
          }
        }
        
        @media (max-width: 480px) {
          .title {
            font-size: 2.5rem;
          }
          
          .tagline {
            font-size: 1.1rem;
          }
          
          .icon-emoji {
            width: 80px;
            height: 80px;
            font-size: 3rem;
          }
          
          .button {
            padding: 18px 20px;
            font-size: 1.1rem;
          }
          
          .button-text {
            font-size: 1.2rem;
          }
          
          .button-icon {
            font-size: 1.5rem;
          }
          
          .button-arrow {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}