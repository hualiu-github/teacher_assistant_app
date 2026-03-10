import { useQuery } from "@tanstack/react-query";
import { fetchCourses, fetchInit, fetchSettings } from "../api/client";

export function useInit() {
  return useQuery({ queryKey: ["init"], queryFn: fetchInit });
}

export function useCourses(date: string) {
  return useQuery({
    queryKey: ["courses", date],
    queryFn: () => fetchCourses(date),
    enabled: Boolean(date),
    refetchInterval: 5000,
  });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
}
