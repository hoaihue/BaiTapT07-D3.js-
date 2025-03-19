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
        "Thời gian tạo đơn": new Date(d["Thời gian tạo đơn"]),
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));


    // Tạo cột Ngày tạo đơn
    const dayData = data1.map(d => ({
        "Ngày tạo đơn": d["Thời gian tạo đơn"].toISOString().split('T')[0], // Lấy ngày dưới dạng YYYY-MM-DD
        "Ngày trong tháng": `Ngày ${d["Thời gian tạo đơn"].getDate().toString().padStart(2, '0')}`, // Định dạng ngày trong tháng
        "Thành tiền": d["Thành tiền"],
        "SL": d["SL"]
    }));


    // Tổng hợp dữ liệu theo ngày trong tháng
    const aggregatedData = dayData.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Ngày trong tháng"] === item["Ngày trong tháng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
            existingItem["Ngày tạo đơn"].push(item["Ngày tạo đơn"]);
        } else {
            acc.push({
                "Ngày trong tháng": item["Ngày trong tháng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"],
                "Ngày tạo đơn": [item["Ngày tạo đơn"]]
            });
        }
        return acc;
    }, []);


    // Tính doanh số bán trung bình và số lượng bán trung bình
    aggregatedData.forEach(d => {
        const uniqueDays = [...new Set(d["Ngày tạo đơn"])].length; // COUNTD(Ngày tạo đơn)
        d["Doanh số bán TB"] = d["Thành tiền"] / uniqueDays;
        d["Số lượng bán TB"] = d["SL"] / uniqueDays;
    });


    // Sắp xếp dữ liệu theo ngày trong tháng
    aggregatedData.sort((a, b) => parseInt(a["Ngày trong tháng"].split(' ')[1]) - parseInt(b["Ngày trong tháng"].split(' ')[1]));


    // Tạo SVG
    const svg = d3.select("#Q5")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // Thang đo
    const x = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Ngày trong tháng"])) // Trục x là các ngày trong tháng
        .range([0, width])
        .padding(0.2);


    const y = d3.scaleLinear()
        .domain([0, 15_000_000]) // Giới hạn trục y từ 0 đến 15 triệu
        .range([height, 0]);


    // Tạo màu sắc cho các ngày trong tháng
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    // Vẽ cột
    const bars = chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Ngày trong tháng"]))
        .attr("y", d => y(d["Doanh số bán TB"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán TB"]))
        .attr("fill", d => colorScale(d["Ngày trong tháng"])) // Màu sắc theo ngày
        .on("mouseover", function (event, d) {
            // Hiển thị tooltip khi di chuột vào thanh
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>${d["Ngày trong tháng"]}</strong></p>
                <p><strong>Doanh số bán TB:</strong> ${(d["Doanh số bán TB"] / 1_000_000).toFixed(1)} triệu VND</p>
                <p><strong>Số lượng bán TB:</strong> ${d["Số lượng bán TB"].toFixed(0)} SKUs</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            // Ẩn tooltip khi di chuột ra khỏi thanh
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
        .attr("x", d => x(d["Ngày trong tháng"]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán TB"]) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${(d["Doanh số bán TB"] / 1_000_000).toFixed(1)} tr`) // Hiển thị giá trị đã chia và thêm "tr"
        .style("font-size", "11px");


    // Trục X
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px")
        .selectAll("text") // Chọn tất cả các nhãn trên trục x
        .style("text-anchor", "end") // Căn chỉnh văn bản
        .attr("dx", "-0.8em") // Điều chỉnh vị trí ngang
        .attr("dy", "0.15em") // Điều chỉnh vị trí dọc
        .attr("transform", "rotate(-45)"); // Xoay nhãn -45 độ


    // Trục Y với định dạng 1M, 2M, ..., 15M
    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`) // Định dạng trục y
            .ticks(15) // Số lượng tick (bước nhảy 1M)
        )
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

