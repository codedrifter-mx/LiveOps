interface Props { status: 'critical' | 'recovery' | 'info'; time: string; service: string; detail: string; }
export function FeedItem({ status, time, service, detail }: Props) {
  return <div className={`feed-item ${status}`}>
    <div className="feed-top"><span className="feed-service">{service}</span><span className="feed-time">{time}</span></div>
    <div className="feed-detail">{detail}</div>
  </div>;
}
