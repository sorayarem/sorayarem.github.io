document.getElementById("button1").addEventListener("click", function() {
    const content = document.getElementById("content1");

    // Get the current computed display style of the content
    const currentDisplay = window.getComputedStyle(content).display;

    if (currentDisplay === "none") {
        content.style.display = "block";
        document.getElementById("button1").style.backgroundColor = "#6E7B51";
    } else {
        content.style.display = "none";
        document.getElementById("button1").style.backgroundColor = "#E49311";
    }
});
