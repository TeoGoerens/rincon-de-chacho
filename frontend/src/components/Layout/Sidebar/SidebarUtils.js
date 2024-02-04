export const handleExpandButtonClick = () => {
  document.body.classList.toggle("collapsed");
};

export const handleLinkClick = (clickedLink) => {
  const allLinks = document.querySelectorAll(".sidebar-links a");

  allLinks.forEach((link) => {
    if (link === clickedLink) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
};
