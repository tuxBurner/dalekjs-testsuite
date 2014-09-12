$(function() {
});


var JsonObj = null;

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    f = files[0];
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            JsonObj = e.target.result
            var parsedJSON = JSON.parse(JsonObj);
            console.log(parsedJSON);
        };
    })(f);

    // Read in JSON as a data URL.
    reader.readAsText(f, 'UTF-8');
}
document.getElementById('files').addEventListener('change', handleFileSelect, false);
