export type Category = {
  id: string;
  name: string;
};

export type SurveyQuestion = {
  prompt: string;
  options: string[];
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  hasPassword: boolean;
  questions: SurveyQuestion[];
};

export type QuickTemplate = {
  id: string;
  label: string;
  categoryId: string;
  body: string;
};

export const appName = "Hòm thư góp ý - LỮ ĐOÀN PPK234";
export const unitName = "LỮ ĐOÀN PPK234";
export const slogan =
  'ĐOÀN TAM ĐẢO ANH HÙNG "CÓ LỆNH LÀ ĐI, CÓ ĐỊCH LÀ ĐÁNH, ĐÃ ĐÁNH LÀ THẮNG"';
export const footerName = "Mai Thanh Tuấn";
export const logoPath = "/logo-ludoan234.png";

export const categories: Category[] = [
  {
    id: "696edfd3b65ce",
    name: "Công tác quân sự",
  },
  {
    id: "696edf354fe11",
    name: "Công tác Đảng, công tác chính trị",
  },
  {
    id: "696ee045dbd3b",
    name: "Công tác hậu cần, kĩ thuật",
  },
];

export const quickMessages: QuickTemplate[] = [
  {
    id: "today-happy",
    label: "Hôm nay tôi vui",
    categoryId: "696edf354fe11",
    body: "Hôm nay tôi vui",
  },
  {
    id: "today-sad",
    label: "Hôm nay tôi buồn",
    categoryId: "696edf354fe11",
    body: "Hôm nay tôi buồn",
  },
  {
    id: "today-tired",
    label: "Hôm nay tôi mệt",
    categoryId: "696edf354fe11",
    body: "Hôm nay tôi mệt",
  },
  {
    id: "today-worried",
    label: "Hôm nay tôi lo lắng",
    categoryId: "696edf354fe11",
    body: "Hôm nay tôi lo lắng",
  },
];

export const surveys: Survey[] = [
  {
    id: "sv_697f2a8b1bac6",
    title: "Khảo sát chất lượng sinh hoạt tuần",
    description: "",
    updatedAt: "24/04/2026",
    hasPassword: false,
    questions: [],
  },
  {
    id: "sv_6977922273aef",
    title: "Khảo sát nắm tình hình tháng 01/2026",
    description: "",
    updatedAt: "24/04/2026",
    hasPassword: true,
    questions: [],
  },
  {
    id: "sv_6985a1b2",
    title: "Khảo sát nắm tình hình tháng 01/2026",
    description:
      "Phục vụ chỉ huy đơn vị nắm bắt tình hình và điều chỉnh công tác.",
    updatedAt: "24/04/2026",
    hasPassword: false,
    questions: [
      {
        prompt:
          "Câu 1. Đồng chí đánh giá thế nào về chất lượng thực hiện nhiệm vụ của đơn vị?",
        options: ["A. Tốt", "B. Không tốt", "C. Rất tốt", "D. Không hài lòng"],
      },
      {
        prompt:
          "Câu 2. Đồng chí có hài lòng với chất lượng sinh hoạt, học tập của đơn vị không?",
        options: ["A. Có", "B. Không", "C. Rất hài lòng", "D. ít hài lòng"],
      },
      {
        prompt:
          "Câu 3. Cán bộ chỉ huy đơn vị có quan tâm, sâu sát bộ đội không?",
        options: [
          "A. Có",
          "B. Rất quan tâm",
          "C. Ít quan tâm",
          "D. Rất quan tâm",
        ],
      },
      {
        prompt:
          "Câu 4. Đồng chí có phát hiện biểu hiện vi phạm kỷ luật, mất đoàn kết không?",
        options: [
          "A. Không phát hiện",
          "B. Có, cần chỉ huy nắm",
          "C. Có nguy cơ mất an toàn",
          "D. Cần trao đổi riêng",
        ],
      },
      {
        prompt:
          "Câu 5. Đồng chí có kiến nghị gì về bảo đảm đời sống, vật chất, tinh thần?",
        options: [
          "A. Bảo đảm tốt",
          "B. Cần quan tâm thêm",
          "C. Có kiến nghị cụ thể",
        ],
      },
    ],
  },
];
