import logMessage from './js/logger';
import './scss/style.scss';
// Log message to console
logMessage('A very warm welcome to Expack!');
// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
    module.hot.accept(); // eslint-disable-line no-undef  
}