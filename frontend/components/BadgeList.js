// components/BadgeList.js
export default function BadgeList({ badges, getIcon }) {
    const formatDate = (dateString) => {
      if (!dateString) return 'Recently earned';
      const date = new Date(dateString);
      return `Earned ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
  
    if (!badges || badges.length === 0) {
      return (
        <div className="empty-badges">
          <div className="empty-icon">🏆</div>
          <h3>No Badges Yet</h3>
          <p>Badges will appear here as learning milestones are achieved.</p>
          
          <style jsx>{`
            .empty-badges {
              text-align: center;
              padding: 60px 20px;
              background: linear-gradient(135deg, #FFD16610, #FFB34710);
              border-radius: 12px;
              border: 2px dashed #FFD16650;
            }
            
            .empty-icon {
              font-size: 3.5rem;
              margin-bottom: 20px;
              opacity: 0.5;
            }
            
            .empty-badges h3 {
              margin: 0 0 10px 0;
              color: #4a5568;
              font-size: 1.3rem;
            }
            
            .empty-badges p {
              margin: 0;
              color: #718096;
              max-width: 300px;
              margin: 0 auto;
              line-height: 1.5;
            }
          `}</style>
        </div>
      );
    }
  
    return (
      <div className="badge-grid">
        {badges.map((badge, index) => (
          <div key={index} className="badge-card">
            <div className="badge-icon">
              {getIcon ? getIcon(badge.badge_name) : badge.badge_icon || '🏆'}
            </div>
            <div className="badge-content">
              <h3>{badge.badge_name}</h3>
              <p className="badge-description">{badge.badge_description}</p>
              <div className="badge-footer">
                <span className="badge-date">{formatDate(badge.earned_at)}</span>
              </div>
            </div>
          </div>
        ))}
        
        <style jsx>{`
          .badge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          
          .badge-card {
            padding: 20px;
            background: linear-gradient(135deg, #FFD16610, #FFB34710);
            border-radius: 16px;
            border: 1px solid #FFD16630;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .badge-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 30px rgba(255, 179, 71, 0.2);
            border-color: #FFB347;
          }
          
          .badge-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(to right, #FFD166, #FFB347);
          }
          
          .badge-icon {
            font-size: 2.5rem;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .badge-content h3 {
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            color: #2d3748;
            font-weight: 700;
          }
          
          .badge-description {
            margin: 0 0 15px 0;
            color: #4a5568;
            line-height: 1.5;
            font-size: 0.95rem;
            min-height: 60px;
          }
          
          .badge-footer {
            padding-top: 10px;
            border-top: 1px solid rgba(255, 179, 71, 0.3);
          }
          
          .badge-date {
            font-size: 0.85rem;
            color: #a0aec0;
            font-weight: 500;
          }
          
          @media (max-width: 768px) {
            .badge-grid {
              grid-template-columns: 1fr;
            }
            
            .badge-card {
              padding: 16px;
            }
            
            .badge-description {
              min-height: auto;
            }
          }
        `}</style>
      </div>
    );
  }