<#assign wp=JspTaglibs["/aps-core"]>
<script type="module" src="<@wp.resourceURL />/static/js/entando-lapam-metopack.js"></script>
<link href="<@wp.resourceURL />/static/css/dropdown.css" rel="stylesheet">
<link href="<@wp.resourceURL />/static/css/tkrad.css" rel="stylesheet">
<link href="<@wp.resourceURL />/static/css/treeview.css" rel="stylesheet">
<#-- entando_resource_injection_point -->
<#-- Don't add anything above this line. The build scripts will automatically link the compiled JS and CSS for you and add them above this line so that the widget can be loaded-->


<@wp.currentWidget param="config" configParam="modulo" var="modulo" />
<entando-lapam-metopack modulo="${modulo}"></entando-lapam-metopack>
