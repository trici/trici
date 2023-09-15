import ReactDOM from 'react-dom/client';
import log from 'loglevel';

function MainRoot() {
  return (
    <div>
      <h1>hello world</h1>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<MainRoot />);
} else {
  log.error('rootElement is null');
}
