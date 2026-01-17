// components/EventList.js
export default function EventList({ events, getIcon }) {
    const formatDate = (dateString) => {
      if (!dateString) return 'Recently';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    if (!events || events.length === 0) {
      return (
        <div className="empty-events">
          <div className="empty-icon">📊</div>
          <h3>No Events Yet</h3>
          <p>Events will appear here as experiences are recorded.</p>
          
          <style jsx>{`
            .empty-events {
              text-align: center;
              padding: 60px 20px;
              background: #f8fafc;
              border-radius: 12px;
              border: 2px dashed #e2e8f0;
            }
            
            .empty-icon {
              font-size: 3.5rem;
              margin-bottom: 20px;
              opacity: 0.5;
            }
            
            .empty-events h3 {
              margin: 0 0 10px 0;
              color: #4a5568;
              font-size: 1.3rem;
            }
            
            .empty-events p {
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
      <div className="event-list">
        {events.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-icon">
              {getIcon ? getIcon(event.event_type) : '📊'}
            </div>
            <div className="event-content">
              <div className="event-header">
                <h3>{event.event_type}</h3>
                <span className="event-time">{formatDate(event.created_at)}</span>
              </div>
              <p className="event-description">{event.description}</p>
              {event.asset_type && (
                <span className="event-tag">{event.asset_type}</span>
              )}
            </div>
          </div>
        ))}
        
        <style jsx>{`
          .event-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .event-item {
            display: flex;
            gap: 16px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }
          
          .event-item:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            border-color: #cbd5e0;
          }
          
          .event-icon {
            font-size: 2rem;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea15, #764ba215);
            border-radius: 10px;
            flex-shrink: 0;
          }
          
          .event-content {
            flex: 1;
          }
          
          .event-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .event-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #2d3748;
            font-weight: 600;
          }
          
          .event-time {
            font-size: 0.8rem;
            color: #a0aec0;
            background: #f7fafc;
            padding: 3px 8px;
            border-radius: 10px;
            font-weight: 500;
          }
          
          .event-description {
            margin: 0 0 10px 0;
            color: #4a5568;
            line-height: 1.5;
            font-size: 0.95rem;
          }
          
          .event-tag {
            display: inline-block;
            font-size: 0.75rem;
            padding: 4px 10px;
            background: #e2e8f0;
            color: #4a5568;
            border-radius: 12px;
            font-weight: 500;
          }
          
          @media (max-width: 768px) {
            .event-item {
              padding: 16px;
            }
            
            .event-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }
            
            .event-time {
              align-self: flex-start;
            }
          }
        `}</style>
      </div>
    );
  }