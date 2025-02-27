document.addEventListener("DOMContentLoaded", () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll("nav ul li a").forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            document.getElementById(targetId).scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    // Dynamic product showcase (future enhancement placeholder)
    const products = [
        { name: "Fresh Milk", description: "Pure and natural milk directly from our farm." },
        { name: "Organic Cheese", description: "Delicious cheese made from high-quality dairy." },
        { name: "Farm Butter", description: "Creamy butter produced with traditional methods." }
    ];

    const productList = document.querySelector(".product-list");
    productList.innerHTML = "";
    products.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `<h3>${product.name}</h3><p>${product.description}</p>`;
        productList.appendChild(productDiv);
    });
});
