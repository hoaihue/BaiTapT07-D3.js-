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
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));


    // Tổng hợp dữ liệu theo "Nhóm hàng"
    const aggregatedData = data1.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Nhóm hàng"] === item["Nhóm hàng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
        } else {
            acc.push({
                "Nhóm hàng": item["Nhóm hàng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"]
            });
        }
        return acc;
    }, []);


    // Sắp xếp dữ liệu giảm dần
    aggregatedData.sort((a, b) => b["Thành tiền"] - a["Thành tiền"]);


    // Tạo SVG
    const svg = d3.select("#Q2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // Thang đo
    const x = d3.scaleLinear()
        .domain([0, 2_000_000_000]) // Giới hạn trục x tới 2 tỷ
        .range([0, width]);


    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Nhóm hàng"])) // Trục y là Nhóm hàng
        .range([0, height])
        .padding(0.2);


    // Tạo màu sắc cho các nhóm hàng
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    // Vẽ cột
    const bars = chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Nhóm hàng"])) // Trục y là Nhóm hàng
        .attr("width", d => x(d["Thành tiền"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            // Hiển thị tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}</p>
                <p><strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VND</p>
                <p><strong>Số lượng bán:</strong> ${d["SL"]} SKUs</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function (d) {
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


    // Nhãn số liệu trên cột
    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Thành tiền"]) + 5) // Điều chỉnh vị trí nhãn
        .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`) // Làm tròn không có số thập phân
        .style("font-size", "11px");


    // Trục X với định dạng 100M, 200M, ..., 2000M
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`) // Định dạng trục x
            .ticks(20) // Số lượng tick (bước nhảy 100M)
        )
        .style("font-size", "11px");


    // Trục Y
    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text") // Chỉnh font size
        .style("font-size", "11px")
        .style("text-anchor", "end");


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

