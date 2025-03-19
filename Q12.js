document.addEventListener("DOMContentLoaded", function () {
    // Chờ dữ liệu được load từ `data.js`
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }


    console.log("Dữ liệu đã load:", window.data);


    // Định nghĩa kích thước
    const margin = { top: 40, right: 40, bottom: 100, left: 200 }, // Giảm margin.right vì không cần filter
        width = 900,
        height = 400;


    // Chuyển đổi dữ liệu
    const data1 = window.data.map(d => ({
        "Mã khách hàng": d["Mã khách hàng"],
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0
    }));


    // Tính chi tiêu khách hàng
    const customerSpending = Array.from(
        d3.rollup(data1,
            v => d3.sum(v, d => d["Thành tiền"]), // SUM(Thành tiền) theo Mã khách hàng
            d => d["Mã khách hàng"]
        ),
        ([key, value]) => ({ "Mã khách hàng": key, "Chi tiêu KH": value })
    );


    // Tạo bins cho chi tiêu khách hàng
    const binSize = 50000;
    const binnedData = Array.from(
        d3.rollup(customerSpending,
            v => v.length, // COUNTD(Mã khách hàng)
            d => Math.floor(d["Chi tiêu KH"] / binSize) * binSize
        ),
        ([key, value]) => ({
            "Khoảng chi tiêu": `Từ ${key} đến ${key + binSize}`,
            "Số lượng KH": value,
            "Chi tiêu KH": key // Giá trị chi tiêu KH để hiển thị trên trục x
        })
    );


    // Sắp xếp dữ liệu theo khoảng chi tiêu tăng dần
    binnedData.sort((a, b) => a["Chi tiêu KH"] - b["Chi tiêu KH"]);


    // Tạo SVG
    const svg = d3.select("#Q12")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // Thang đo
    const x = d3.scaleBand()
        .domain(binnedData.map(d => `${d["Chi tiêu KH"] / 1000}K`)) // Trục x là giá trị chi tiêu KH (50K, 100K, ...)
        .range([0, width])
        .padding(0.2);


    const y = d3.scaleLinear()
        .domain([0, 1600]) // Giới hạn trục y từ 0 đến 1600
        .range([height, 0]);


    // Vẽ cột
    const bars = chart.selectAll(".bar")
        .data(binnedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(`${d["Chi tiêu KH"] / 1000}K`))
        .attr("y", d => y(d["Số lượng KH"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Số lượng KH"]))
        .attr("fill", "steelblue") // Màu mặc định steelblue
        .on("mouseover", function (event, d) {
            // Hiển thị tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Đã chi tiêu ${d["Khoảng chi tiêu"]}</strong></p>
                <p><strong>Số lượng KH:</strong> ${d["Số lượng KH"].toLocaleString()}</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            // Ẩn tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            // Nhấp chuột một lần: làm nhạt các thanh khác
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3); // Làm nhạt tất cả các thanh
                d3.select(this).attr("opacity", 1); // Giữ nguyên màu của thanh được chọn
            } else {
                // Nhấp chuột hai lần: trở về trạng thái ban đầu
                bars.attr("opacity", 1); // Khôi phục màu sắc ban đầu
            }
        });


    // Trục X
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px")
        .selectAll("text") // Chọn tất cả các nhãn trên trục x
        .style("text-anchor", "end") // Căn chỉnh văn bản
        .attr("dx", "-0.8em") // Điều chỉnh vị trí ngang
        .attr("dy", "0.15em") // Điều chỉnh vị trí dọc
        .attr("transform", "rotate(-90)") // Xoay nhãn -90 độ
        .text((d, i) => (i % 2 === 0 ? `${binnedData[i]["Chi tiêu KH"] / 1000 + 50}K` : "")); // Chỉ hiển thị 50K, 150K, 250K, ...


    // Trục Y (giới hạn 0 -> 1600, bước 100)
    chart.append("g")
        .call(d3.axisLeft(y).ticks(16)) // 16 ticks để có bước nhảy 100
        .style("font-size", "11px");


    // Tạo tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left"); // Căn trái nội dung tooltip
});

