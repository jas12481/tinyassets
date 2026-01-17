// components/ProgressCard.js
export default function ProgressCard({ title, value, icon, color = '#667eea', subtitle }) {
    return (
      <div className="progress-card">
        <div className="card-icon" style={{ background: color + '20', color: color }}>
          {icon}
        </div>
        <div className="card-content">
          <h3>{title}</h3>
          <div className="value">{value}</div>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
        
        <style jsx>{`
          .progress-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #eaeaea;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .progress-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .card-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            flex-shrink: 0;
          }
          
          .card-content h3 {
            margin: 0 0 5px 0;
            font-size: 0.9rem;
            color: #718096;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .value {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2d3748;
            margin: 0;
            line-height: 1;
          }
          
          .subtitle {
            font-size: 0.85rem;
            color: #a0aec0;
            margin-top: 5px;
          }
          
          @media (max-width: 768px) {
            .progress-card {
              padding: 15px;
            }
            
            .card-icon {
              width: 50px;
              height: 50px;
              font-size: 1.5rem;
            }
            
            .value {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </div>
    );
  }