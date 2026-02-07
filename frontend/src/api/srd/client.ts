import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../../generated/graphql'

const SRD_GRAPHQL_ENDPOINT = 'https://www.dnd5eapi.co/graphql'

const graphqlClient = new GraphQLClient(SRD_GRAPHQL_ENDPOINT)

export const srdApi = getSdk(graphqlClient)
