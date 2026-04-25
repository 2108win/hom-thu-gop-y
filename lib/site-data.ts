export type ListenerUser = {
  id: string;
  fullname: string;
  rank: string;
  position: string;
  phone: string;
  order: number;
};

export type Category = {
  id: string;
  name: string;
  assigned: string[];
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
export const slogan = "CÓ LỆNH LÀ ĐI, CÓ ĐỊCH LÀ ĐÁNH, ĐÃ ĐÁNH LÀ THẮNG";
export const footerName = "Mai Thanh Tuấn";
export const logoPath = "/logo-ludoan234.png";

export const listenerUsers: Record<string, ListenerUser> = {
  u_6973879cc7632: {
    id: "u_6973879cc7632",
    fullname: "Ban Tham mưu",
    rank: "Trực ban",
    position: "Tiếp nhận nội dung huấn luyện, sẵn sàng chiến đấu",
    phone: "0878129694",
    order: 1,
  },
  u_697387ede9da3: {
    id: "u_697387ede9da3",
    fullname: "Cơ quan Chính trị",
    rank: "Trực ban",
    position: "Tiếp nhận tâm tư, quan hệ đồng chí, công tác chính trị",
    phone: "0366320086",
    order: 2,
  },
  u_69739a09575fb: {
    id: "u_69739a09575fb",
    fullname: "Ban Hậu cần - Kỹ thuật",
    rank: "Trực ban",
    position: "Tiếp nhận nội dung bảo đảm đời sống, trang bị, kỹ thuật",
    phone: "0878129694",
    order: 3,
  },
};

export const categories: Category[] = [
  {
    id: "696edf354fe11",
    name: "Công tác Đảng, công tác chính trị",
    assigned: ["u_697387ede9da3"],
  },
  {
    id: "696edfd3b65ce",
    name: "Huấn luyện, sẵn sàng chiến đấu",
    assigned: ["u_6973879cc7632"],
  },
  {
    id: "696ee045dbd3b",
    name: "Hậu cần, kỹ thuật, đời sống",
    assigned: ["u_69739a09575fb"],
  },
  {
    id: "696ee0b512a21",
    name: "Kỷ luật, an toàn, quan hệ đồng chí",
    assigned: ["u_697387ede9da3", "u_6973879cc7632"],
  },
];

export const quickMessages: QuickTemplate[] = [
  {
    id: "discipline-risk",
    label: "Vi phạm kỷ luật, mất an toàn",
    categoryId: "696ee0b512a21",
    body: "- Vấn đề/sự việc chính:\n- Thời gian xảy ra:\n- Địa điểm:\n- Người/bộ phận liên quan nếu biết:\n- Mức độ ảnh hưởng hoặc nguy cơ:\n- Đề nghị chỉ huy xem xét:",
  },
  {
    id: "training-duty",
    label: "Huấn luyện, sẵn sàng chiến đấu",
    categoryId: "696edfd3b65ce",
    body: "- Nội dung góp ý về huấn luyện/nhiệm vụ:\n- Thời gian hoặc buổi huấn luyện liên quan:\n- Khó khăn, vướng mắc cụ thể:\n- Ảnh hưởng đến đơn vị/cá nhân:\n- Đề xuất khắc phục:",
  },
  {
    id: "political-work",
    label: "Tâm tư, quan hệ đồng chí",
    categoryId: "696edf354fe11",
    body: "- Nội dung cần trao đổi:\n- Thời gian, hoàn cảnh phát sinh:\n- Cá nhân/tập thể liên quan nếu có:\n- Mong muốn được hỗ trợ:\n- Đề xuất hướng giải quyết:",
  },
  {
    id: "logistics-life",
    label: "Hậu cần, đời sống, kỹ thuật",
    categoryId: "696ee045dbd3b",
    body: "- Nội dung kiến nghị về hậu cần/đời sống/kỹ thuật:\n- Vị trí, bộ phận hoặc trang bị liên quan:\n- Tình trạng hiện tại:\n- Ảnh hưởng đến sinh hoạt/nhiệm vụ:\n- Đề xuất xử lý:",
  },
  {
    id: "improvement",
    label: "Đề xuất cải tiến công việc",
    categoryId: "696edfd3b65ce",
    body: "- Nội dung đề xuất:\n- Việc hiện nay đang vướng ở điểm nào:\n- Cách làm đề nghị áp dụng:\n- Lợi ích dự kiến cho đơn vị:\n- Điều kiện cần để thực hiện:",
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
