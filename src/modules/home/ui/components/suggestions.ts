export interface Suggestion {
  id: string;
  label: string;
  query: string;
}

export const suggestions: Suggestion[] = [
  {
    id: "birthday-cake",
    label: "Order Birthday Cake",
    query:
      "Recommend a chocolate birthday cake for delivery in Colombo tomorrow",
  },
  {
    id: "flowers",
    label: "Fresh Flowers",
    query: "Show me some fresh red flower bouquets under 5000 LKR",
  },
  {
    id: "track-order",
    label: "Track Order",
    query: "Track my order VIMP34456",
  },
  {
    id: "gift-vouchers",
    label: "Gift Vouchers",
    query: "Suggest some popular gift vouchers for a friend",
  },
];
