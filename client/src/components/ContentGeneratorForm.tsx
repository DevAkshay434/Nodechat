import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { contentFormSchema, type ContentForm } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wand2 } from "lucide-react";
import { type ShopifyProduct, type ShopifyCollection } from "@shared/schema";

interface ContentGeneratorFormProps {
  onGenerationComplete: (result: any) => void;
  onStatusChange: (type: "success" | "error" | "loading" | null, message?: string) => void;
}

export default function ContentGeneratorForm({ onGenerationComplete, onStatusChange }: ContentGeneratorFormProps) {
  // Fetch products and collections
  const { data: productsData } = useQuery({
    queryKey: ['shopifyProducts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shopify/products');
      const data = await response.json();
      return data.products as ShopifyProduct[];
    }
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['shopifyCollections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shopify/collections');
      const data = await response.json();
      return data.collections as ShopifyCollection[];
    }
  });
  // Define the form with React Hook Form and Zod validation
  const form = useForm<ContentForm>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      numH2s: 3,
      h2WordLimit: 8,
      sectionLength: "Medium",
      voice: "Second person",
      enableTables: false,
      enableLists: true,
      enableH3: true,
      introType: "Standard intro",
      faqType: "FAQ + Short Answer",
      publishType: "blog",
      imageCount: 2,
      googleSheetId: "",
      category: "default",
      enableInternalLinks: true
    },
  });

  // Content generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ContentForm) => {
      const response = await apiRequest("POST", "/api/generate-content", data);
      return response.json();
    },
    onMutate: () => {
      onStatusChange("loading", "Generating content, please wait...");
    },
    onSuccess: (data) => {
      onGenerationComplete(data);
    },
    onError: (error) => {
      console.error("Generation error:", error);
      onStatusChange("error", error.message || "Failed to generate content");
    },
  });

  // Form submission handler
  const onSubmit = (data: ContentForm) => {
    generateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Generation Form</CardTitle>
        <CardDescription>
          Fill in the details to generate SEO-optimized content for your Shopify store.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Settings Section */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-4">Basic Settings</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g. 10 Best Skincare Routines for Winter" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The main title for your blog post or page.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* Number of H2s */}
                <FormField
                  control={form.control}
                  name="numH2s"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Number of H2s</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How many section headings?
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* H2 Word Limit */}
                <FormField
                  control={form.control}
                  name="h2WordLimit"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>H2 Word Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={3} 
                          max={20} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Max words per heading.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* Section Length */}
                <FormField
                  control={form.control}
                  name="sectionLength"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Section Length</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Small">Small (2 paragraphs)</SelectItem>
                          <SelectItem value="Medium">Medium (3 paragraphs)</SelectItem>
                          <SelectItem value="Large">Large (4 paragraphs)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Length of each section.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Content Style Section */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-4">Content Style</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Voice */}
                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Voice</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="First person plural">First person plural (We, Us)</SelectItem>
                          <SelectItem value="First person singular">First person singular (I, Me)</SelectItem>
                          <SelectItem value="Second person">Second person (You, Your)</SelectItem>
                          <SelectItem value="Third person">Third person (They, Them)</SelectItem>
                          <SelectItem value="Professional">Professional (Formal)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Writing perspective for your content.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* Intro Type */}
                <FormField
                  control={form.control}
                  name="introType"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Intro Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select intro type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Standard intro">Standard intro</SelectItem>
                          <SelectItem value="Search Intent intro">Search Intent intro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Type of introduction for your content.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* FAQ Type */}
                <FormField
                  control={form.control}
                  name="faqType"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>FAQ Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select FAQ type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No FAQ">No FAQ</SelectItem>
                          <SelectItem value="FAQ + Short Answer">FAQ + Short Answer</SelectItem>
                          <SelectItem value="FAQ + Long Answer">FAQ + Long Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Include FAQs at the end of the content.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {/* Publish Type */}
                <FormField
                  control={form.control}
                  name="publishType"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Publish As</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select publish type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="page">Page</SelectItem>
                          <SelectItem value="draft">Draft (Don't Publish)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Shopify Products & Collections */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-4">Shopify Products & Collections</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={form.control}
                  name="selectedProducts"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Select Products</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange([...field.value || [], value])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose products to link" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productsData?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-500">Selected products:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {field.value.map((productId) => {
                              const product = productsData?.find(p => p.id === productId);
                              return product && (
                                <Badge 
                                  key={product.id}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => field.onChange(field.value?.filter(id => id !== product.id))}
                                >
                                  {product.title} ×
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selectedCollections"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Select Collections</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange([...field.value || [], value])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose collections to link" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {collectionsData?.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-500">Selected collections:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {field.value.map((collectionId) => {
                              const collection = collectionsData?.find(c => c.id === collectionId);
                              return collection && (
                                <Badge 
                                  key={collection.id}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => field.onChange(field.value?.filter(id => id !== collection.id))}
                                >
                                  {collection.title} ×
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Content Elements Section */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-4">Content Elements</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="enableTables"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Tables</FormLabel>
                        <FormDescription>
                          Include data tables in the content where relevant.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="enableLists"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Lists</FormLabel>
                        <FormDescription>
                          Include bulleted and numbered lists in the content.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="enableH3"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable H3</FormLabel>
                        <FormDescription>
                          Include sub-headings (H3) under main sections.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Image & Media Settings */}
            <div>
              <h3 className="text-md font-medium text-neutral-700 mb-4">Image & Media Settings</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={form.control}
                  name="imageCount"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Image Count</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select image count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Featured Image Only</SelectItem>
                          <SelectItem value="2">Featured + 1 Body Image</SelectItem>
                          <SelectItem value="3">Featured + 2 Body Images</SelectItem>
                          <SelectItem value="4">Featured + 3 Body Images</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Number of images to include.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Content Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Custom/Default</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="home">Home & Garden</SelectItem>
                          <SelectItem value="tech">Technology</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Preset categories with image collections.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="googleSheetId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Custom Google Sheet ID or URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 1aBcD...XyZ or https://docs.google.com/spreadsheets/d/1aBcD...XyZ/edit" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Use your own Google Sheet with MAIN IMAGE, SECONDARY IMAGE, LINK columns.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="enableInternalLinks"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 flex flex-row items-start space-x-3 space-y-0 pt-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Internal Links</FormLabel>
                        <FormDescription>
                          Automatically insert links from your Google Sheet.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-200">
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={generateMutation.isPending}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Generate & Publish Content"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
