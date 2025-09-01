// Switch navigation for admin pages
/* exported goToDashboard, goToGateway, goToEditor */
function goToDashboard() { window.location.href = 'admin-dashboard.html'; }
function goToGateway() { window.location.href = 'payment-gateway.html'; }
function goToEditor() { window.location.href = 'visual-editor.html'; }

// intentionally small file: functions are exported for inline usage in admin templates
// expose to global so lint/build tools know they're used by HTML inline handlers
if (typeof window !== 'undefined') {
	window.goToDashboard = goToDashboard;
	window.goToGateway = goToGateway;
	window.goToEditor = goToEditor;
}
