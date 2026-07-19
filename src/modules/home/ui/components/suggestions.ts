export interface Suggestion {
  id: string;
  label: string;
  query: string;
}

export const suggestions: Suggestion[] = [
  {
    id: "browse-categories",
    label: "Browse Categories",
    query: "What shopping categories do you have?",
  },
  {
    id: "search-toys",
    label: "Search Products",
    query: "Search for soft teddy bear toys under 10000 LKR",
  },
  {
    id: "product-details",
    label: "Get Product Details",
    query: "Show details of the chocolate gateau cake with ID 10834",
  },
  {
    id: "check-cities",
    label: "Check Delivery Cities",
    query: "Do you deliver to Kandy or Batticaloa?",
  },
  {
    id: "check-delivery",
    label: "Delivery Fee Quote",
    query: "How much is the delivery fee for a cake to Negombo on Friday?",
  },
  {
    id: "create-order",
    label: "Create Guest Order",
    query: "Help me buy a red rose bouquet for delivery in Colombo tomorrow",
  },
  {
    id: "track-order",
    label: "Track Order Status",
    query: "Track my order number 239485",
  },
];
