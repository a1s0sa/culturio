<script lang="ts">
  type Props = {
    title: string;
    description: string;
    url: string;
    image: string;
    imageAlt?: string;
    type?: 'website' | 'article';
    imageWidth?: number;
    imageHeight?: number;
  };

  let {
    title,
    description,
    url,
    image,
    imageAlt = title,
    type = 'website',
    imageWidth = 1200,
    imageHeight = 630
  }: Props = $props();
</script>

<svelte:head>
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="Culturio" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content={imageWidth.toString()} />
  <meta property="og:image:height" content={imageHeight.toString()} />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:alt" content={imageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
