import { Request, Response } from "express";
import Product from "../../models/product.model";
import axios from "axios";

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

interface ProductMetadata {
  slug: string;
  tags: string[];
}

const productMetadataList: ProductMetadata[] = [
  {
    slug: "buoi-da-xanh",
    tags: ["buoi", "da xanh", "tep hong", "ngot", "mong nuoc", "giai nhiet", "3 mien", "viet nam"]
  },
  {
    slug: "buoi-dien-djac-biet",
    tags: ["buoi", "dien", "thom", "ngot thanh", "dac san", "3 mien", "qua bieu"]
  },
  {
    slug: "cam-duong",
    tags: ["cam", "duong", "on chau", "ngot", "mat", "giai nhiet", "de boc", "tre em"]
  },
  {
    slug: "cam-sanh-djac-biet",
    tags: ["cam", "sanh", "vat nuoc", "nuoc cam", "chua ngot", "boi bo", "vitamin c"]
  },
  {
    slug: "cam-tui-uc",
    tags: ["cam", "tui", "uc", "nhap khau", "ngot", "thom"]
  },
  {
    slug: "dua-luoi-djai-loan",
    tags: ["dua", "luoi", "dai loan", "nhap khau", "gion", "ngot thanh", "giai nhiet"]
  },
  {
    slug: "coc-bao-tu-got-san",
    tags: ["coc", "bao tu", "got san", "gion", "chua", "chua ngot", "an vat", "cham muoi"]
  },
  {
    slug: "dau-tay-hana",
    tags: ["dau", "dau tay", "hana", "moc chau", "ngot", "thom", "mong nuoc", "do", "vitamin", "mua dong", "mua xuan", "tuoi"]
  },
  {
    slug: "dua-xiem",
    tags: ["dua", "dua xiem", "nuoc dua", "ngot", "giai nhiet", "mat", "mua he"]
  },
  {
    slug: "roi-djo-an-phuoc",
    tags: ["roi", "roi do", "man", "an phuoc", "gion", "ngot", "nhieu nuoc", "mat"]
  },
  {
    slug: "roi-xanh-an-phuoc",
    tags: ["roi", "roi xanh", "man", "an phuoc", "gion", "mat", "chua ngot"]
  },
  {
    slug: "sau-rieng-thai",
    tags: ["sau", "sau rieng", "thai", "beo", "ngay", "thom", "ngot dam", "hat lep", "vua trai cay"]
  },
  {
    slug: "thanh-long-ruot-djo",
    tags: ["thanh long", "ruot do", "ngot", "mat", "bo mau", "3 mien"]
  },
  {
    slug: "vu-sua-tim-lo-ren",
    tags: ["vu sua", "tim", "lo ren", "ngot lim", "bo duong", "mua xuan"]
  },
  {
    slug: "xoai-bao-tu",
    tags: ["xoai", "bao tu", "chua", "gion", "an vat", "cham muoi", "got san"]
  },
  {
    slug: "xoai-hat-lep",
    tags: ["xoai", "hat lep", "chin", "ngot", "mem", "thom"]
  },
  {
    slug: "cam-vang-navel",
    tags: ["cam", "vang", "navel", "nhap khau", "ngot dam", "thom", "khong hat"]
  },
  {
    slug: "cherry-djo-uc",
    tags: ["cherry", "cherry do", "uc", "nhap khau", "ngot", "cung", "sang trong", "bo duong"]
  },
  {
    slug: "coc-tao-rockit-new-zealand",
    tags: ["tao", "rockit", "new zealand", "nhap khau", "gion", "ngot", "ong tao", "tre em"]
  },
  {
    slug: "kiwi-vang-sungold",
    tags: ["kiwi", "vang", "sungold", "nhap khau", "ngot", "chua nhe", "vitamin c", "bo"]
  },
  {
    slug: "le-han-quoc",
    tags: ["le", "han quoc", "nhap khau", "gion", "ngot thanh", "nhieu nuoc", "mat"]
  },
  {
    slug: "luu-hat-mem",
    tags: ["luu", "hat mem", "do", "ngot", "nhap khau", "dep da"]
  },
  {
    slug: "muoi-hao-hao",
    tags: ["muoi", "cham", "hao hao", "gia vi", "chua cay"]
  },
  {
    slug: "muoi-ngoc-yen",
    tags: ["muoi", "cham", "ngoc yen", "gia vi", "thom"]
  },
  {
    slug: "muoi-o-mai",
    tags: ["muoi", "cham", "o mai", "gia vi", "ngot", "chua ngot"]
  },
  {
    slug: "muoi-tom-tay-ninh",
    tags: ["muoi", "cham", "tom", "tay ninh", "gia vi", "cay", "thom nong"]
  }
];

export const chatApi = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({
        code: "error",
        message: "Tin nhắn không hợp lệ",
      });
      return;
    }

    const cleanMsg = message.toLowerCase().trim();

    // 1. Fetch active products from DB to feed into AI prompt or use in fallback
    const allProducts = await Product.find({
      deleted: false,
      status: "active",
    }).select("name priceNew priceOld slug images category description stock");

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const productListString = allProducts
          .map(
            (p) =>
              `- Tên: ${p.name}, Slug: ${p.slug}, Giá mới: ${p.priceNew}đ, Giá cũ: ${p.priceOld || 0}đ, Còn hàng: ${p.stock}`
          )
          .join("\n");

        const prompt = `
Bạn là Trợ lý AI tư vấn và bán hàng của "Quang Trường Shop" - cửa hàng chuyên bán hoa quả sạch, hoa quả nhập khẩu và muối chấm.
Hãy trò chuyện thân thiện, cởi mở, lễ phép bằng tiếng Việt.
Khách hàng vừa gửi câu hỏi: "${message}"

Dưới đây là danh sách toàn bộ sản phẩm thực tế đang kinh doanh tại Quang Trường Shop:
${productListString}

Hãy tư vấn sản phẩm phù hợp nhất cho khách hàng dựa trên câu hỏi của họ. Chỉ được giới thiệu những sản phẩm có trong danh sách trên.
Ví dụ: Nếu khách hỏi "tư vấn hoa quả mùa này" hoặc "trái cây mùa này", hãy gợi ý vài loại trái cây tươi ngon đang bán chạy/có sẵn (ví dụ: Dâu tây Hana, Sầu riêng Thái, Cherry đỏ Úc, Cam đường, Dưa lưới...).
Nếu khách hỏi về hoa quả nhập khẩu, hãy tư vấn các loại có chữ "nhập khẩu" hoặc nguồn gốc nước ngoài như Cherry đỏ Úc, Lê Hàn Quốc, Táo Rockit New Zealand, Kiwi vàng Sungold.
Nếu khách hỏi về muối chấm hoặc đồ ăn kèm, hãy tư vấn các loại Muối gia vị.
Nếu khách có ý định mua hàng hoặc hỏi giá, hãy nhắc đến giá bán tương ứng của các loại quả đó.

Bạn PHẢI trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau:
{
  "reply": "Nội dung phản hồi chi tiết, thuyết phục bằng tiếng Việt gửi cho khách hàng, khuyên dùng sản phẩm cụ thể.",
  "recommendedProductSlugs": ["slug-san-pham-1", "slug-san-pham-2"]
}
Lưu ý quan trọng:
- Trường "recommendedProductSlugs" phải là một mảng chứa các slug của những sản phẩm được đề xuất, chính xác theo trường "Slug" trong danh sách trên.
- Chỉ đề xuất sản phẩm thực sự phù hợp với ngữ cảnh câu hỏi. Nếu câu hỏi chỉ là chào hỏi bình thường hoặc không liên quan đến sản phẩm, có thể trả về mảng rỗng [].
`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  reply: {
                    type: "STRING",
                    description: "Lời tư vấn chi tiết, thân thiện bằng tiếng Việt.",
                  },
                  recommendedProductSlugs: {
                    type: "ARRAY",
                    items: {
                      type: "STRING",
                    },
                    description: "Danh sách các slug của sản phẩm được đề xuất trong cuộc hội thoại.",
                  },
                },
                required: ["reply", "recommendedProductSlugs"],
              },
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 8000,
          }
        );

        if (
          response.data &&
          response.data.candidates &&
          response.data.candidates[0] &&
          response.data.candidates[0].content &&
          response.data.candidates[0].content.parts &&
          response.data.candidates[0].content.parts[0]
        ) {
          const rawText = response.data.candidates[0].content.parts[0].text;
          const result = JSON.parse(rawText);

          if (result && typeof result.reply === "string") {
            const slugs = result.recommendedProductSlugs || [];
            // Fetch the actual products based on recommended slugs
            const recommendedProducts = allProducts.filter((p) =>
              p.slug && slugs.includes(p.slug)
            );

            res.json({
              code: "success",
              reply: result.reply,
              products: recommendedProducts,
            });
            return;
          }
        }
      } catch (geminiError) {
        console.error("Lỗi khi gọi Gemini API, chuyển sang Fallback:", geminiError);
      }
    }

    // --- FALLBACK RULE-BASED ENGINE ---
    const rawCleanMsg = cleanMsg;
    const cleanMsgNoAccent = removeAccents(cleanMsg);

    // Compute score for each product
    const scoredProducts = allProducts.map((p) => {
      let score = 0;
      const slug = p.slug || "";
      const name = p.name || "";
      const nameLower = name.toLowerCase();
      const nameLowerNoAccent = removeAccents(nameLower);

      // 1. Direct name match (e.g. "sầu riêng", "dâu tây")
      if (rawCleanMsg.includes(nameLower)) {
        score += 15;
      } else if (cleanMsgNoAccent.includes(nameLowerNoAccent)) {
        score += 10;
      }

      // 2. Tokenized tag matches
      const meta = productMetadataList.find((m) => m.slug === slug);
      if (meta) {
        meta.tags.forEach((tag) => {
          if (cleanMsgNoAccent.includes(tag)) {
            score += 4;
            const regex = new RegExp(`\\b${tag}\\b`, "i");
            if (regex.test(cleanMsgNoAccent)) {
              score += 2;
            }
          }
        });
      }

      // 3. Category/taste alignment matching
      if (
        cleanMsgNoAccent.includes("nhap khau") ||
        cleanMsgNoAccent.includes("ngoai") ||
        cleanMsgNoAccent.includes("nuoc ngoai")
      ) {
        if (meta?.tags.includes("nhap khau")) score += 5;
      }

      if (
        cleanMsgNoAccent.includes("muoi") ||
        cleanMsgNoAccent.includes("cham") ||
        cleanMsgNoAccent.includes("gia vi")
      ) {
        if (meta?.tags.includes("muoi") || meta?.tags.includes("cham")) score += 5;
      }

      if (
        cleanMsgNoAccent.includes("ngot") ||
        cleanMsgNoAccent.includes("beo") ||
        cleanMsgNoAccent.includes("ngay")
      ) {
        if (
          meta?.tags.includes("ngot") ||
          meta?.tags.includes("ngot thanh") ||
          meta?.tags.includes("ngot lim") ||
          meta?.tags.includes("beo") ||
          meta?.tags.includes("ngay")
        ) {
          score += 3;
        }
      }

      if (cleanMsgNoAccent.includes("chua")) {
        if (
          meta?.tags.includes("chua") ||
          meta?.tags.includes("chua ngot") ||
          meta?.tags.includes("chua nhe")
        ) {
          score += 5;
        }
      }

      if (cleanMsgNoAccent.includes("gion") || cleanMsgNoAccent.includes("cung")) {
        if (meta?.tags.includes("gion") || meta?.tags.includes("cung")) {
          score += 5;
        }
      }

      if (
        cleanMsgNoAccent.includes("giai nhiet") ||
        cleanMsgNoAccent.includes("mat") ||
        cleanMsgNoAccent.includes("nuoc") ||
        cleanMsgNoAccent.includes("mua he")
      ) {
        if (
          meta?.tags.includes("giai nhiet") ||
          meta?.tags.includes("mong nuoc") ||
          meta?.tags.includes("nhieu nuoc") ||
          meta?.tags.includes("mat") ||
          meta?.tags.includes("mua he")
        ) {
          score += 4;
        }
      }

      if (
        cleanMsgNoAccent.includes("mua nay") ||
        cleanMsgNoAccent.includes("hien tai") ||
        cleanMsgNoAccent.includes("moi ve") ||
        cleanMsgNoAccent.includes("ban chay")
      ) {
        if (
          [
            "dau-tay-hana",
            "sau-rieng-thai",
            "cherry-djo-uc",
            "dua-xiem",
            "xoai-bao-tu",
            "coc-bao-tu-got-san",
          ].includes(slug)
        ) {
          score += 6;
        }
      }

      return { product: p, score };
    });

    const matchingScored = scoredProducts
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score);

    let recommendedProducts: any[] = [];
    let reply = "";

    if (matchingScored.length > 0) {
      recommendedProducts = matchingScored.slice(0, 4).map((sp) => sp.product);
      const topMatchedNames = recommendedProducts.map((p) => p.name).join(", ");

      if (cleanMsgNoAccent.includes("muoi") || cleanMsgNoAccent.includes("cham")) {
        reply = `Dạ, để thưởng thức trái cây thêm trọn vị và đậm đà, shop em có các loại muối chấm hảo hạng rất được ưa chuộng như: ${topMatchedNames}. Quý khách xem và thêm vào giỏ hàng thử nhé!`;
      } else if (
        cleanMsgNoAccent.includes("nhap khau") ||
        cleanMsgNoAccent.includes("ngoai")
      ) {
        reply = `Dạ, đây là danh sách các loại hoa quả nhập khẩu tươi ngon, giòn ngọt, có đầy đủ giấy tờ chứng nhận nguồn gốc xuất xứ tại shop: ${topMatchedNames}. Mình xem thử nha!`;
      } else if (cleanMsgNoAccent.includes("chua")) {
        reply = `Dạ, nếu mình thích vị chua thanh giòn ngọt bắt vị, shop xin gợi ý các loại quả ăn vặt mọng nước tuyệt vời kèm muối chấm ngon như: ${topMatchedNames}. Mời mình tham khảo ạ!`;
      } else if (cleanMsgNoAccent.includes("gion")) {
        reply = `Dạ, các loại hoa quả có độ giòn tan, ngọt mát đanh quả rất thích hợp ăn trực tiếp hoặc làm quà tặng gồm có: ${topMatchedNames}. Shop cam kết hàng tươi mới mỗi ngày ạ!`;
      } else if (
        cleanMsgNoAccent.includes("beo") ||
        cleanMsgNoAccent.includes("ngay") ||
        cleanMsgNoAccent.includes("sau")
      ) {
        reply = `Dạ, nhắc đến hương vị béo ngậy thơm ngon tuyệt hảo thì sầu riêng hay vú sữa tím là lựa chọn số 1 ạ. Em xin giới thiệu: ${topMatchedNames}. Hàng bao ăn chất lượng múi, cơm dày béo ngậy!`;
      } else if (
        cleanMsgNoAccent.includes("mua nay") ||
        cleanMsgNoAccent.includes("giai nhiet") ||
        cleanMsgNoAccent.includes("mat")
      ) {
        reply = `Dạ thời tiết mùa này rất thích hợp để thưởng thức các loại trái cây mọng nước, thanh nhiệt giải độc hoặc giòn ngọt mát lịm như: ${topMatchedNames}. Shop đang sẵn hàng tươi mới, mời mình xem ạ!`;
      } else {
        reply = `Dạ, dựa trên câu hỏi của mình, em xin đề xuất các loại sản phẩm đang bán chạy và cực kỳ phù hợp: ${topMatchedNames}. Bạn cần em tư vấn kỹ hơn về loại quả nào trong số này ạ?`;
      }
    } else {
      if (
        cleanMsgNoAccent.includes("chao") ||
        cleanMsgNoAccent.includes("hello") ||
        cleanMsgNoAccent.includes("hi") ||
        cleanMsgNoAccent.includes("alo") ||
        cleanMsgNoAccent.includes("oi")
      ) {
        reply =
          "Xin chào quý khách! Em là Trợ lý AI của Quang Trường Shop. Em luôn sẵn sàng tư vấn hoa quả sạch, hoa quả nhập khẩu tươi ngon cùng muối chấm hảo hạng. Hôm nay mình muốn tìm mua loại quả hay hương vị thế nào để em gợi ý ạ?";
      } else {
        reply =
          "Dạ, em chưa tìm thấy sản phẩm khớp hoàn toàn với mô tả này của mình. Nhưng cửa hàng em luôn sẵn các loại trái cây sạch (Sầu riêng Thái béo ngậy, Dâu tây Hana ngọt thơm, Kiwi nhập khẩu...) và Muối tôm Tây Ninh đậm vị. Quý khách muốn tham khảo vị ngọt, chua, béo hay muối chấm để em tư vấn rõ hơn ạ?";
      }
      const defaultSlugs = [
        "dau-tay-hana",
        "sau-rieng-thai",
        "cherry-djo-uc",
        "muoi-tom-tay-ninh",
      ];
      recommendedProducts = allProducts.filter((p) => p.slug && defaultSlugs.includes(p.slug));
    }

    res.json({
      code: "success",
      reply: reply,
      products: recommendedProducts,
    });
  } catch (error) {
    console.error("Lỗi trong chatApi controller:", error);
    res.status(500).json({
      code: "error",
      message: "Có lỗi xảy ra khi xử lý yêu cầu",
    });
  }
};
